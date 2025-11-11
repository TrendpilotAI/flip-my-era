/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@/test/test-utils';
import { EbookGenerator } from '../EbookGenerator';
import { __testSupabaseMocks__ } from '@/test/setup';

const toastMock = vi.fn();
const actionButtonsCalls: any[] = [];
const creditWallCalls: any[] = [];

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
  chapters: [] as Array<{ title: string; content: string; id: string }> ,
};

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isSignedIn: true,
    getToken: vi.fn(async () => 'test-token'),
  }),
}));

vi.mock('@/modules/story/utils/storyPrompts', () => ({
  taylorSwiftThemes: {
    'coming-of-age': {
      title: 'Coming of Age',
      description: 'Youthful adventures',
      inspirations: ['Song 1'],
    },
  },
  storyFormats: {
    preview: {
      name: 'Preview',
      description: 'Short sample',
      targetLength: '300 words',
      chapters: 1,
    },
    'short-story': {
      name: 'Short Story',
      description: 'Full experience',
      targetLength: '1500 words',
      chapters: 5,
    },
    novella: {
      name: 'Novella',
      description: 'Extended adventure',
      targetLength: '4000 words',
      chapters: 8,
    },
  },
}));

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/modules/story/hooks/useStreamingGeneration', () => ({
  useStreamingGeneration: () => streamingMock,
}));

vi.mock('@/modules/shared/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/modules/shared/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
}));

vi.mock('@/modules/shared/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/modules/shared/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, ...props }: any) => (
    <div role="option" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/modules/shared/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/modules/shared/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/modules/user/components/CreditBalance', () => ({
  CreditBalance: ({ onBalanceChange }: any) => (
    <div data-testid="credit-balance" onClick={() => onBalanceChange?.(5)}>
      Credit Balance
    </div>
  ),
}));

vi.mock('@/modules/user/components/CreditPurchaseModal', () => ({
  CreditPurchaseModal: ({ isOpen }: any) => (isOpen ? <div data-testid="credit-purchase-modal">Purchase</div> : null),
}));

vi.mock('../CreditWallModal', () => ({
  CreditWallModal: (props: any) => {
    creditWallCalls.push(props);
    return props.isOpen ? <div data-testid="credit-wall-modal">Credit Wall</div> : null;
  },
}));

vi.mock('../CompletionCelebration', () => ({
  CompletionCelebration: ({ isVisible }: any) => (
    isVisible ? <div data-testid="completion-celebration">Celebration</div> : null
  ),
}));

vi.mock('../ActionButtons', () => ({
  ActionButtons: (props: any) => {
    actionButtonsCalls.push(props);
    return <div data-testid="action-buttons" />;
  },
}));

let latestGenerateClick: (() => Promise<void> | void) | null = null;

vi.mock('../GenerateButton', () => ({
  GenerateButton: ({ onClick, type }: any) => {
    latestGenerateClick = onClick;
    return (
      <button data-testid={`generate-${type}`} onClick={onClick}>
        Generate {type}
      </button>
    );
  },
}));

vi.mock('../StreamingProgress', () => ({
  StreamingProgress: () => <div data-testid="streaming-progress">Streaming</div>,
}));

vi.mock('../StreamingChapterView', () => ({
  StreamingChapterView: ({ chapter }: any) => (
    <div data-testid="streaming-chapter">{chapter.title}</div>
  ),
}));

vi.mock('../ChapterView', () => ({
  ChapterView: ({ chapter }: any) => <div data-testid="chapter-view">{chapter.title}</div>,
}));

vi.mock('../BookReader', () => ({
  BookReader: ({ chapters, onClose }: any) => (
    <div data-testid="book-reader" onClick={onClose}>
      Reader {chapters.length}
    </div>
  ),
}));

vi.mock('@/modules/shared/utils/creditPricing', () => ({
  calculateCreditCost: () => ({ totalCost: 1 }),
}));

vi.mock('@/core/integrations/samcart/client', () => ({
  samcartClient: {
    redirectToCheckout: vi.fn(),
  },
}));

vi.mock('@/modules/shared/utils/downloadUtils', () => ({
  downloadEbook: vi.fn(),
}));

vi.mock('@/modules/story/services/ai', () => ({
  generateEbookIllustration: vi.fn(),
  generateTaylorSwiftIllustration: vi.fn(),
}));

describe('EbookGenerator', () => {
  beforeEach(() => {
    actionButtonsCalls.length = 0;
    creditWallCalls.length = 0;
    latestGenerateClick = null;
    streamingMock.chapters = [];
    streamingMock.isGenerating = false;
    startGenerationMock.mockImplementation((config: any) => {
      const generated = [
        {
          title: 'Generated Chapter 1',
          content: 'Generated content 1',
          id: 'chapter-1',
        },
      ];
      streamingMock.chapters = generated;
      config.onComplete?.(generated);
    });

    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          has_sufficient_credits: true,
          current_balance: 5,
          subscription_type: null,
          transaction_id: null,
          bypass_credits: false,
        },
      },
    });
  });

  it('renders theme configuration state before chapters are generated', () => {
    render(
      <EbookGenerator
        originalStory="Once upon a time"
        storyId="story-123"
      />
    );

    expect(screen.getByText(/Taylor Swift-Inspired Themes/i)).toBeInTheDocument();
    expect(screen.getByTestId('credit-balance')).toBeInTheDocument();
    expect(screen.getByTestId('generate-chapters')).toBeInTheDocument();
  });

  it('generates chapters through streaming flow and exposes locked actions', async () => {
    const user = userEvent.setup();

    render(
      <EbookGenerator
        originalStory="Once upon a time"
        storyId="story-123"
      />
    );

    await act(async () => {
      await user.click(screen.getByTestId('generate-chapters'));
    });

    await act(async () => {
      // ensure microtasks finish
      await Promise.resolve();
    });

    expect(startGenerationMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: /read your book/i })).toBeInTheDocument();
    expect(screen.getByTestId('streaming-chapter')).toHaveTextContent('Generated Chapter 1');
    expect(actionButtonsCalls.at(-1)?.isLocked).toBe(true);
    expect(creditWallCalls.at(-1)?.isOpen).toBe(true);
  });
});
