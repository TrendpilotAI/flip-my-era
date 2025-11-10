import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ChapterView } from '../ChapterView';

describe('ChapterView', () => {
  const mockChapter = {
    title: 'Test Chapter',
    content: 'This is a test paragraph.\n\n"This is a quoted paragraph."',
    id: 'test-chapter-1',
  };

  it('renders chapter title and content correctly', () => {
    render(<ChapterView chapter={mockChapter} index={0} isGeneratingImages={false} />);
    
    expect(screen.getByText('Test Chapter')).toBeInTheDocument();
    expect(screen.getByText('This is a test paragraph.')).toBeInTheDocument();
    expect(screen.getByText('"This is a quoted paragraph."')).toBeInTheDocument();
  });

  it('applies correct styling to quoted paragraphs', () => {
    render(<ChapterView chapter={mockChapter} index={0} isGeneratingImages={false} />);
    
    const quotedParagraph = screen.getByText('"This is a quoted paragraph."');
    expect(quotedParagraph).toHaveClass('text-blue-600', 'italic');
  });

  it('displays image placeholder when no image is available', () => {
    render(<ChapterView chapter={mockChapter} index={0} isGeneratingImages={false} />);
    
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-gray-400');
  });

  it('displays loading spinner when generating images', () => {
    render(<ChapterView chapter={mockChapter} index={0} isGeneratingImages={true} />);
    
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');
  });

  it('displays chapter image when available', () => {
    const chapterWithImage = {
      ...mockChapter,
      imageUrl: 'https://example.com/test-image.jpg',
    };
    
    render(<ChapterView chapter={chapterWithImage} index={0} isGeneratingImages={false} />);
    
    const image = screen.getByRole('img', { name: /illustration for test chapter/i });
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    expect(image).toHaveClass('w-full', 'h-auto', 'rounded-lg', 'shadow-lg');
  });

  it('applies animation delay based on index', () => {
    render(<ChapterView chapter={mockChapter} index={2} isGeneratingImages={false} />);
    
    const container = screen.getByRole('article');
    expect(container).toHaveStyle({ animationDelay: '400ms' });
  });

  it('handles empty content gracefully', () => {
    const emptyChapter = {
      ...mockChapter,
      content: '',
    };
    
    render(<ChapterView chapter={emptyChapter} index={0} isGeneratingImages={false} />);
    
    expect(screen.getByText('Test Chapter')).toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('handles multiple paragraphs correctly', () => {
    const multiParagraphChapter = {
      ...mockChapter,
      content: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
    };
    
    render(<ChapterView chapter={multiParagraphChapter} index={0} isGeneratingImages={false} />);
    
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Third paragraph.')).toBeInTheDocument();
  });

  it('limits visible content and hides illustration when chapter is locked', () => {
    const lockedChapter = {
      ...mockChapter,
      content: 'Unlocked paragraph.\n\nHidden paragraph.',
      imageUrl: 'https://example.com/image.jpg',
    };

    render(
      <ChapterView
        chapter={lockedChapter}
        index={0}
        isGeneratingImages={false}
        isLocked
      />
    );

    expect(screen.getByText('Unlocked paragraph.')).toBeInTheDocument();
    expect(screen.queryByText('Hidden paragraph.')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(/image placeholder/i)
    ).toBeInTheDocument();
  });

  it('invokes unlock handler when user requests to unlock chapter', async () => {
    const user = userEvent.setup();
    const onRequestUnlock = vi.fn();

    render(
      <ChapterView
        chapter={mockChapter}
        index={0}
        isGeneratingImages={false}
        isLocked
        onRequestUnlock={onRequestUnlock}
      />
    );

    await user.click(screen.getByRole('button', { name: /unlock story/i }));

    expect(onRequestUnlock).toHaveBeenCalledTimes(1);
  });
}); 