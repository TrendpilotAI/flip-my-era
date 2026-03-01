/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@/test/test-utils';
import { BookReader } from '../BookReader';

const toastMock = vi.fn();

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/modules/shared/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../BookPageView', () => ({
  BookPageView: ({ chapter }: any) => (
    <div data-testid="book-page-view">{chapter?.title}</div>
  ),
}));

vi.mock('../BookNavigation', () => ({
  BookNavigation: () => <div data-testid="book-navigation">navigation</div>,
}));

vi.mock('../BookmarkManager', () => ({
  BookmarkManager: () => <div data-testid="bookmark-manager">bookmarks</div>,
}));

vi.mock('../ReadingPreferences', () => ({
  ReadingPreferences: () => <div data-testid="reading-preferences">preferences</div>,
}));

vi.mock('../ReadingProgress', () => ({
  ReadingProgress: ({ currentChapter, totalChapters }: any) => (
    <div data-testid="reading-progress">{`Chapter ${currentChapter} of ${totalChapters}`}</div>
  ),
}));

vi.mock('@/modules/shared/components/DownloadShareModal', () => ({
  DownloadShareModal: () => null,
}));

describe('BookReader', () => {
  const chapters = [
    { title: 'Chapter One', content: 'Chapter one content.' },
    { title: 'Chapter Two', content: 'Chapter two content.' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    (window as any).speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      speaking: false,
    };
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the current chapter title and reading progress', () => {
    render(
      <BookReader
        chapters={chapters}
        useTaylorSwiftThemes
        isUnlocked
      />
    );

    expect(screen.getByTestId('book-page-view')).toHaveTextContent('Chapter One');
    expect(screen.getByTestId('reading-progress')).toHaveTextContent('Chapter 1 of 2');
    expect(screen.queryByText(/unlock your story/i)).not.toBeInTheDocument();
  });

  it('shows lock overlay and triggers unlock callback', async () => {
    // Use real timers for userEvent click interactions to avoid deadlocks
    vi.useRealTimers();
    const user = userEvent.setup();
    const onRequestUnlock = vi.fn();

    render(
      <BookReader
        chapters={chapters}
        useTaylorSwiftThemes
        isUnlocked={false}
        onRequestUnlock={onRequestUnlock}
      />
    );

    expect(screen.getByText(/unlock your story to continue reading/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /unlock full story/i }));

    expect(onRequestUnlock).toHaveBeenCalledTimes(1);
    // Restore fake timers for afterEach cleanup
    vi.useFakeTimers();
  });

  it('calls onClose when the reader is closed via overlay action', async () => {
    // Use real timers for userEvent click interactions to avoid deadlocks
    vi.useRealTimers();
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BookReader
        chapters={chapters}
        useTaylorSwiftThemes
        isUnlocked={false}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /close reader/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    // Restore fake timers for afterEach cleanup
    vi.useFakeTimers();
  });
});
