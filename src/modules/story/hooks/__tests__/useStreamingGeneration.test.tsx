import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { useStreamingGeneration } from '../useStreamingGeneration';

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/modules/auth/contexts/ClerkAuthContext', () => ({
  useClerkAuth: () => ({ getToken: vi.fn(async () => null) })
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

describe('useStreamingGeneration (integration-style)', () => {
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
});

