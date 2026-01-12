/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
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

// Skip: Complex integration-style tests causing memory issues
// TODO: Refactor to unit tests with proper mocking
describe.skip('useStreamingGeneration (integration-style)', () => {
  beforeEach(() => {
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'anon-key',
    };

    (globalThis as any).fetch = vi.fn(async (url: string, init: any) => {
      if (String(url).endsWith('/functions/v1/stream-chapters') && init?.method === 'POST') {
        return makeSseResponse([
          { type: 'progress', currentChapter: 1, totalChapters: 1, progress: 0, message: 'start' },
          { type: 'chapter', currentChapter: 1, totalChapters: 1, chapterTitle: 'Ch 1', chapterContent: 'Hello' },
          { type: 'complete', progress: 100, message: 'done' },
        ]);
      }
      return new Response('not found', { status: 404 });
    });
  });

  it('streams chapters and completes', async () => {
    const Test: React.FC = () => {
      const { startGeneration, isGenerating, isComplete, chapters, currentChapter, totalChapters } = useStreamingGeneration();
      useEffect(() => {
        startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 1 });
      }, [startGeneration]);
      return (
        <div>
          <div data-testid="gen">{String(isGenerating)}</div>
          <div data-testid="done">{String(isComplete)}</div>
          <div data-testid="count">{chapters.length}</div>
          <div data-testid="pos">{currentChapter}/{totalChapters}</div>
          <div data-testid="title">{chapters[0]?.title || ''}</div>
        </div>
      );
    };

    render(<Test />);

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    await waitFor(() => expect(screen.getByTestId('done').textContent).toBe('true'));
    expect(screen.getByTestId('title').textContent).toBe('Ch 1');
    expect(screen.getByTestId('pos').textContent).toBe('1/1');
  });

  it('handles error events from stream', async () => {
    (globalThis as any).fetch = vi.fn(async () =>
      makeSseResponse([
        { type: 'progress', currentChapter: 0, totalChapters: 1, progress: 0, message: 'init' },
        { type: 'error', message: 'Upstream error' },
      ])
    );

    const Test: React.FC = () => {
      const { startGeneration, isGenerating, isComplete, message } = useStreamingGeneration();
      useEffect(() => {
        startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 1 });
      }, [startGeneration]);
      return (
        <div>
          <div data-testid="gen">{String(isGenerating)}</div>
          <div data-testid="done">{String(isComplete)}</div>
          <div data-testid="msg">{message}</div>
        </div>
      );
    };

    render(<Test />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'));
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/Error: Upstream error/);
  });

  it('continues on parse errors in the stream', async () => {
    (globalThis as any).fetch = vi.fn(async () => {
      // malformed line without JSON, then a valid chapter and completion
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

    const Test: React.FC = () => {
      const { startGeneration, chapters, isComplete } = useStreamingGeneration();
      useEffect(() => {
        startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 1 });
      }, [startGeneration]);
      return (
        <div>
          <div data-testid="count">{chapters.length}</div>
          <div data-testid="done">{String(isComplete)}</div>
        </div>
      );
    };

    render(<Test />);
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    await waitFor(() => expect(screen.getByTestId('done').textContent).toBe('true'));
  });

  it('handles 401 unauthorized response up front', async () => {
    (globalThis as any).fetch = vi.fn(async () => new Response('unauthorized', { status: 401 }));

    const Test: React.FC = () => {
      const { startGeneration, isGenerating, isComplete, message } = useStreamingGeneration();
      useEffect(() => {
        startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 1 });
      }, [startGeneration]);
      return (
        <div>
          <div data-testid="gen">{String(isGenerating)}</div>
          <div data-testid="done">{String(isComplete)}</div>
          <div data-testid="msg">{message}</div>
        </div>
      );
    };

    render(<Test />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'));
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/Failed to start generation \(401\)/);
  });

  it('aborts generation via stopGeneration', async () => {
    // Long running stream to allow abort
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

    const Test: React.FC = () => {
      const { startGeneration, stopGeneration, isGenerating, isComplete, message } = useStreamingGeneration();
      useEffect(() => {
        startGeneration({ originalStory: 'Once', useTaylorSwiftThemes: false, numChapters: 2 });
        setTimeout(() => stopGeneration(), 50);
      }, [startGeneration, stopGeneration]);
      return (
        <div>
          <div data-testid="gen">{String(isGenerating)}</div>
          <div data-testid="done">{String(isComplete)}</div>
          <div data-testid="msg">{message}</div>
        </div>
      );
    };

    render(<Test />);
    await waitFor(() => expect(screen.getByTestId('gen').textContent).toBe('false'));
    expect(screen.getByTestId('done').textContent).toBe('false');
    expect(screen.getByTestId('msg').textContent).toMatch(/Generation cancelled|Generation stopped/);
  });
});

