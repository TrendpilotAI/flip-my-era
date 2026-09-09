/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { useStreamingGeneration } from '../useStreamingGeneration';

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    isAuthenticated: true,
    user: { id: '123', email: 'test@example.com' },
    isLoading: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    fetchCreditBalance: vi.fn().mockResolvedValue(100),
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isNewUser: false,
    setIsNewUser: vi.fn(),
    SignInButton: vi.fn(),
    SignUpButton: vi.fn(),
    UserButton: vi.fn()
  })
}));

vi.mock('@/core/integrations/sentry', () => ({
  sentryService: {
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
    startTransaction: vi.fn(() => ({
      setTag: vi.fn(),
      finish: vi.fn(),
    })),
  },
}));

vi.mock('@/core/integrations/posthog', () => ({
  posthogEvents: {
    storyGenerationStarted: vi.fn(),
    chapterCompleted: vi.fn(),
    storyGenerationCompleted: vi.fn(),
    storyGenerationFailed: vi.fn(),
    storyGenerationAborted: vi.fn(),
  },
}));

function makeSseResponse(events: Array<Record<string, any>>): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const lines = events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
      controller.enqueue(encoder.encode(lines));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('useStreamingGeneration', () => {
  beforeEach(() => {
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'anon-key',
    };

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).endsWith('/functions/v1/stream-chapters')) {
        return makeSseResponse([
          { type: 'progress', currentChapter: 1, totalChapters: 1, progress: 0, message: 'start' },
          { type: 'chapter', currentChapter: 1, totalChapters: 1, chapterTitle: 'Ch 1', chapterContent: 'Hello' },
          { type: 'complete', progress: 100, message: 'done' },
        ]);
      }
      return new Response('not found', { status: 404 });
    });
  });

  // Helper: test harness that calls startGeneration exactly once via ref guard
  function TestHarness({ fetchOverride }: { fetchOverride?: () => Promise<Response> }) {
    const { startGeneration, isGenerating, isComplete, chapters, currentChapter, totalChapters, message } = useStreamingGeneration();
    const started = useRef(false);

    useEffect(() => {
      if (fetchOverride) {
        (globalThis as any).fetch = vi.fn(fetchOverride);
      }
    }, [fetchOverride]);

    useEffect(() => {
      if (!started.current) {
        started.current = true;
        startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 1 });
      }
    }, [startGeneration]);

    return (
      <div>
        <div data-testid="gen">{String(isGenerating)}</div>
        <div data-testid="done">{String(isComplete)}</div>
        <div data-testid="count">{chapters.length}</div>
        <div data-testid="pos">{currentChapter}/{totalChapters}</div>
        <div data-testid="title">{chapters[0]?.title || ''}</div>
        <div data-testid="msg">{message}</div>
      </div>
    );
  }

  it('streams chapters and completes', async () => {
    render(<TestHarness />);

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'), { timeout: 5000 });
    await waitFor(() => expect(screen.getByTestId('done').textContent).toBe('true'));
    expect(screen.getByTestId('title').textContent).toBe('Ch 1');
    expect(screen.getByTestId('pos').textContent).toBe('1/1');

    const fetchMock = vi.mocked(globalThis.fetch);
    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body)) as { idempotencyKey?: string };
    expect(body.idempotencyKey).toMatch(/^stream-chapters:.+/);
  });

  it('treats a stream error event as a terminal failure', async () => {
    (globalThis as any).fetch = vi.fn(async () =>
      makeSseResponse([
        { type: 'progress', currentChapter: 0, totalChapters: 1, progress: 0, message: 'init' },
        { type: 'error', message: 'Upstream error' },
      ])
    );

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/Upstream error/);
  });

  it('continues on parse errors in the stream', async () => {
    (globalThis as any).fetch = vi.fn(async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode('data: {not json}\n\n'));
          controller.enqueue(enc.encode('data: {"type":"chapter","currentChapter":1,"totalChapters":1,"chapterTitle":"T","chapterContent":"C"}\n\n'));
          controller.enqueue(enc.encode('data: {"type":"complete","progress":100}\n\n'));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    });

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'), { timeout: 5000 });
    await waitFor(() => expect(screen.getByTestId('done').textContent).toBe('true'));
  });

  it('handles 401 unauthorized response', async () => {
    (globalThis as any).fetch = vi.fn(async () => new Response('unauthorized', { status: 401 }));

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/Authentication failed/);
  });

  it('restores a completed replay stream', async () => {
    (globalThis as any).fetch = vi.fn(async () =>
      makeSseResponse([
        { type: 'status', status: 'replay', replay: true, totalChapters: 1 },
        {
          type: 'chapter',
          replay: true,
          currentChapter: 1,
          totalChapters: 1,
          chapterTitle: 'Cached chapter',
          chapterContent: 'Cached content',
        },
        { type: 'complete', replay: true, totalChapters: 1, progress: 100 },
      ])
    );

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('done').textContent).toBe('true'), { timeout: 5000 });
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('title').textContent).toBe('Cached chapter');
    expect(screen.getByTestId('msg').textContent).toMatch(/restored/i);
  });

  it('surfaces an in-progress lease without starting a stream', async () => {
    (globalThis as any).fetch = vi.fn(async () => new Response(JSON.stringify({
      error: 'GENERATION_IN_PROGRESS',
      status: 'in_progress',
      retry_after: 12,
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    }));

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/already in progress.*12 seconds/i);
  });

  it('surfaces insufficient credits and emits the credit-wall event', async () => {
    const exhaustedListener = vi.fn();
    window.addEventListener('credits:exhausted', exhaustedListener);
    (globalThis as any).fetch = vi.fn(async () => new Response(JSON.stringify({
      error: 'INSUFFICIENT_CREDITS',
      status: 'insufficient',
      current_balance: 1,
      required: 3,
    }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    }));

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/Insufficient credits.*Current balance: 1.*Required: 3/i);
    expect(exhaustedListener).toHaveBeenCalledTimes(1);
    window.removeEventListener('credits:exhausted', exhaustedListener);
  });

  it('aborts generation via stopGeneration', async () => {
    (globalThis as any).fetch = vi.fn(async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode('data: {"type":"progress","currentChapter":1,"totalChapters":2,"progress":0,"message":"start"}\n\n'));
          // keep open, caller will abort
        },
        cancel() {},
      });
      return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    });

    function AbortTest() {
      const { startGeneration, stopGeneration, isGenerating, isComplete, message } = useStreamingGeneration();
      const started = useRef(false);

      useEffect(() => {
        if (!started.current) {
          started.current = true;
          startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 2 });
          setTimeout(() => stopGeneration(), 50);
        }
      }, [startGeneration, stopGeneration]);

      return (
        <div>
          <div data-testid="gen">{String(isGenerating)}</div>
          <div data-testid="done">{String(isComplete)}</div>
          <div data-testid="msg">{message}</div>
        </div>
      );
    }

    render(<AbortTest />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/cancel|stop|abort/i);
  });
});
