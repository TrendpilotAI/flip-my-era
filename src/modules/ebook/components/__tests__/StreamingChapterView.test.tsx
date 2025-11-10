/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@/test/test-utils';
import { StreamingChapterView } from '../StreamingChapterView';

vi.mock('@/modules/shared/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/modules/story/components/StreamingText', () => ({
  StreamingText: ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    if (onComplete) {
      setTimeout(() => onComplete(), 0);
    }
    return <div data-testid="streaming-text">{text}</div>;
  },
}));

vi.mock('@/modules/shared/components/ui/image-skeleton', () => ({
  ImageSkeleton: ({ showLabel }: any) => (
    <div data-testid="image-skeleton">{showLabel ? 'generating' : 'placeholder'}</div>
  ),
}));

describe('StreamingChapterView', () => {
  const baseChapter = {
    title: 'Streaming Chapter',
    content: 'Paragraph one.\n\nParagraph two.',
    streamingContent: 'Streaming content...',
    id: 'chapter-1',
  };

  it('shows streaming state when chapter is streaming', () => {
    render(
      <StreamingChapterView
        chapter={{ ...baseChapter, isStreaming: true }}
        index={0}
        showStreamingText
      />
    );

    expect(screen.getByText(/writing chapter/i)).toBeInTheDocument();
    expect(screen.getByText('Streaming content...')).toBeInTheDocument();
  });

  it('hides streaming content and reveals full text when toggled', async () => {
    const user = userEvent.setup();

    render(
      <StreamingChapterView
        chapter={baseChapter}
        index={1}
        showStreamingText
      />
    );

    expect(screen.getByTestId('streaming-text')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /show full/i }));
    });

    expect(screen.queryByTestId('streaming-text')).not.toBeInTheDocument();
    expect(screen.getByText('Paragraph one.')).toBeInTheDocument();
    expect(screen.getByText('Paragraph two.')).toBeInTheDocument();
  });

  it('locks content and triggers unlock callback when requested', async () => {
    const user = userEvent.setup();
    const onRequestUnlock = vi.fn();

    render(
      <StreamingChapterView
        chapter={baseChapter}
        index={2}
        showStreamingText
        isLocked
        onRequestUnlock={onRequestUnlock}
      />
    );

    expect(screen.getByText(/unlock to reveal premium illustrations/i)).toBeInTheDocument();
    expect(screen.queryByText('Paragraph two.')).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /unlock story/i }));
    });

    expect(onRequestUnlock).toHaveBeenCalledTimes(1);
  });
});
