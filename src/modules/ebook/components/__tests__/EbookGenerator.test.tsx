/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@/test/test-utils';
import { EbookGenerator } from '../EbookGenerator';

const toastMock = vi.fn();
const actionButtonsCalls: any[] = [];
const creditWallCalls: any[] = [];

const authState = vi.hoisted(() => ({
  isSignedIn: true,
  token: 'opaque-better-auth-session-token',
}));
const edgeTransport = vi.hoisted(() => ({ invokeAuthenticatedFunction: vi.fn() }));
const legacyBoundary = vi.hoisted(() => ({
  called: vi.fn((name: string) => {
    throw new Error(`Forbidden legacy ebook boundary called: ${name}`);
  }),
}));

vi.mock('@/core/integrations/supabase/client', () => ({
  invokeAuthenticatedFunction: edgeTransport.invokeAuthenticatedFunction,
}));

// Ebook persistence must be the dedicated authenticated Edge boundary, never user-data.
vi.mock('@/core/integrations/supabase/userData', () => ({
  saveGeneratedBook: () => legacyBoundary.called('saveGeneratedBook'),
}));

const startGenerationMock = vi.fn();
const streamingMock = {
  startGeneration: startGenerationMock,
  stopGeneration: vi.fn(),
  resetGeneration: vi.fn(),
  isGenerating: false,
  currentChapter: 0,
  totalChapters: 0,
  progress: 0,
  message: '',
  estimatedTimeRemaining: 0,
  isComplete: false,
  chapters: [] as Array<{ title: string; content: string; id: string }>,
};

vi.mock('@/core/integrations/better-auth/AuthProvider', () => ({
  useSupabaseAuth: () => ({
    isSignedIn: authState.isSignedIn,
    getToken: async () => authState.token,
  }),
}));

vi.mock('@/modules/story/utils/storyPrompts', () => ({
  taylorSwiftThemes: {
    'coming-of-age': { title: 'Coming of Age', description: 'Youthful adventures', inspirations: ['Song 1'] },
  },
  storyFormats: {
    preview: { name: 'Preview', description: 'Short sample', targetLength: '300 words', chapters: 1 },
    'short-story': { name: 'Short Story', description: 'Full experience', targetLength: '1500 words', chapters: 5 },
    novella: { name: 'Novella', description: 'Extended adventure', targetLength: '4000 words', chapters: 8 },
  },
}));

vi.mock('@/modules/shared/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock('@/modules/story/hooks/useStreamingGeneration', () => ({ useStreamingGeneration: () => streamingMock }));
vi.mock('@/modules/shared/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => <button type="button" onClick={onClick} {...props}>{children}</button>,
}));
vi.mock('@/modules/shared/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <button type="button" aria-pressed={checked} onClick={() => onCheckedChange?.(!checked)} {...props} />
  ),
}));
vi.mock('@/modules/shared/components/ui/label', () => ({ Label: ({ children, ...props }: any) => <label {...props}>{children}</label> }));
vi.mock('@/modules/shared/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div role="option" {...props}>{children}</div>,
}));
vi.mock('@/modules/shared/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));
vi.mock('@/modules/user/components/CreditBalance', () => ({ CreditBalance: () => <div data-testid="credit-balance">Credit Balance</div> }));
vi.mock('@/modules/user/components/CreditPurchaseModal', () => ({ CreditPurchaseModal: ({ isOpen }: any) => isOpen ? <div>Purchase</div> : null }));
vi.mock('../CreditWallModal', () => ({
  CreditWallModal: (props: any) => {
    creditWallCalls.push(props);
    return props.isOpen ? <div data-testid="credit-wall-modal">Credit Wall</div> : null;
  },
}));
vi.mock('../CompletionCelebration', () => ({ CompletionCelebration: ({ isVisible }: any) => isVisible ? <div>Celebration</div> : null }));
vi.mock('../ActionButtons', () => ({
  ActionButtons: (props: any) => {
    actionButtonsCalls.push(props);
    return <div data-testid="action-buttons" />;
  },
}));
vi.mock('../GenerateButton', () => ({
  GenerateButton: ({ onClick, type }: any) => <button data-testid={`generate-${type}`} onClick={onClick}>Generate {type}</button>,
}));
vi.mock('../StreamingProgress', () => ({ StreamingProgress: () => <div>Streaming</div> }));
vi.mock('../StreamingChapterView', () => ({ StreamingChapterView: ({ chapter }: any) => <div data-testid="streaming-chapter">{chapter.title}</div> }));
vi.mock('../ChapterView', () => ({ ChapterView: ({ chapter }: any) => <div>{chapter.title}</div> }));
vi.mock('../BookReader', () => ({ BookReader: ({ chapters }: any) => <div>Reader {chapters.length}</div> }));
vi.mock('@/modules/shared/utils/creditPricing', () => ({ calculateCreditCost: () => ({ totalCost: 1 }) }));
vi.mock('@/modules/shared/utils/downloadUtils', () => ({ downloadEbook: vi.fn() }));
vi.mock('@/modules/story/services/ai', () => ({ generateEbookIllustration: vi.fn(), generateTaylorSwiftIllustration: vi.fn() }));

const generatedChapters = [{ title: 'Generated Chapter 1', content: 'Generated content 1', id: 'chapter-1' }];

function renderGenerator() {
  return render(<EbookGenerator originalStory="Once upon a time" storyId="story-123" />);
}

function galleryPersistenceCalls() {
  return edgeTransport.invokeAuthenticatedFunction.mock.calls.filter(
    ([functionName]) => functionName === 'gallery-books',
  );
}

describe('EbookGenerator', () => {
  beforeEach(() => {
    authState.isSignedIn = true;
    authState.token = 'opaque-better-auth-session-token';
    actionButtonsCalls.length = 0;
    creditWallCalls.length = 0;
    streamingMock.chapters = [];
    edgeTransport.invokeAuthenticatedFunction.mockReset();
    legacyBoundary.called.mockReset();
    startGenerationMock.mockImplementation((config: any) => {
      streamingMock.chapters = generatedChapters;
      config.onComplete?.(generatedChapters);
    });
    edgeTransport.invokeAuthenticatedFunction.mockImplementation(async (functionName: string) => {
      if (functionName === 'credits-validate') {
        return {
          data: {
            success: true,
            data: {
              has_sufficient_credits: true,
              current_balance: 5,
              subscription_type: null,
              bypass_credits: false,
              transaction_id: '44444444-4444-4444-8444-444444444444',
            },
          },
          error: null,
        };
      }
      if (functionName === 'gallery-books') {
        return { data: { generation: { id: 'generation-42' }, book: { id: 'memory-42', status: 'completed' }, created: true }, error: null };
      }
      return { data: null, error: new Error(`Unexpected function ${functionName}`) };
    });
  });

  it('rejects browser persistence, token decoding, and the legacy user-data boundary in source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/modules/ebook/components/EbookGenerator.tsx'), 'utf8');
    expect(source).toContain("'gallery-books'");
    expect(source).toContain('invokeAuthenticatedFunction');
    expect(source).not.toContain('integrations/supabase/userData');
    expect(source).not.toContain('saveGeneratedBook');
    expect(source).not.toMatch(/\.from\(\s*['"](?:ebook_generations|memory_books)['"]\s*\)/);
    expect(source).not.toMatch(/extractUserIdFromToken|decode(?:Jwt|Token)|atob\(/);
  });

  it('streams chapters and persists completion only through gallery-books with server-owned content', async () => {
    const user = userEvent.setup();
    renderGenerator();
    await act(async () => {
      await user.click(screen.getByTestId('generate-chapters'));
      await Promise.resolve();
    });

    expect(await screen.findByRole('button', { name: /read your book/i })).toBeInTheDocument();
    expect(screen.getByTestId('streaming-chapter')).toHaveTextContent('Generated Chapter 1');
    expect(actionButtonsCalls.at(-1)?.isLocked).toBe(true);
    expect(creditWallCalls.at(-1)?.isOpen).toBe(true);
    expect(legacyBoundary.called).not.toHaveBeenCalled();
    expect(galleryPersistenceCalls()).toHaveLength(1);
    expect(galleryPersistenceCalls()[0]).toEqual([
      'gallery-books',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^ebook:story-123:/),
          generation: expect.objectContaining({ storyId: 'story-123', transactionId: '44444444-4444-4444-8444-444444444444' }),
          book: expect.objectContaining({ originalStoryId: 'story-123', chapters: generatedChapters }),
        }),
      }),
    ]);
    const [, options] = galleryPersistenceCalls()[0] as [string, { body: Record<string, unknown>; headers?: unknown }];
    expect(options).not.toHaveProperty('headers');
    expect(options.body).not.toHaveProperty('userId');
    expect(options.body).not.toHaveProperty('user_id');
    expect(options.body).not.toHaveProperty('token');
    expect(legacyBoundary.called).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Book Saved' }));
  });

  it('uses the same gallery-books POST contract from the non-streaming completion path', async () => {
    const user = userEvent.setup();
    renderGenerator();
    const streamingToggle = screen.getAllByRole('button', { pressed: true })[1];
    await act(async () => await user.click(streamingToggle));
    await act(async () => {
      await user.click(screen.getByTestId('generate-chapters'));
      await Promise.resolve();
    });

    expect(legacyBoundary.called).not.toHaveBeenCalled();
    expect(galleryPersistenceCalls()).toHaveLength(1);
    expect(galleryPersistenceCalls()[0]?.[1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^ebook:story-123:/),
        generation: expect.objectContaining({ storyId: 'story-123' }),
        book: expect.objectContaining({ originalStoryId: 'story-123', chapters: generatedChapters }),
      }),
    }));
    expect(legacyBoundary.called).not.toHaveBeenCalled();
  });

  it('replays completion through the same idempotency key without exposing the opaque token to persistence', async () => {
    const user = userEvent.setup();
    let onComplete: ((chapters: typeof generatedChapters) => Promise<void>) | undefined;
    startGenerationMock.mockImplementation((config: any) => { onComplete = config.onComplete; });
    renderGenerator();
    await act(async () => {
      await user.click(screen.getByTestId('generate-chapters'));
      await Promise.resolve();
    });
    expect(onComplete).toBeTypeOf('function');

    await act(async () => {
      await onComplete?.(generatedChapters);
      await onComplete?.(generatedChapters);
    });

    const persistenceCalls = galleryPersistenceCalls();
    expect(legacyBoundary.called).not.toHaveBeenCalled();
    expect(persistenceCalls).toHaveLength(2);
    const keys = persistenceCalls.map(([, options]) => (options as { body: { idempotencyKey: string } }).body.idempotencyKey);
    expect(keys).toEqual([keys[0], keys[0]]);
    for (const [, options] of persistenceCalls) {
      expect(options).not.toHaveProperty('headers');
      expect((options as { body: Record<string, unknown> }).body).not.toHaveProperty('token');
    }
    expect(legacyBoundary.called).not.toHaveBeenCalled();
  });
});
