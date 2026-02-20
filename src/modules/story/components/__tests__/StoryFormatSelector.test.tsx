import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axeComponent } from '@/test/a11y-helpers';
import { StoryFormatSelector } from '../StoryFormatSelector';

// Mock StoryWizardContext to avoid pulling in storylineGeneration -> supabase chain
vi.mock('../../contexts/StoryWizardContext', () => ({
  StoryFormat: {},
}));

describe('StoryFormatSelector', () => {
  const defaultProps = {
    selectedFormat: null as null | 'preview' | 'short-story' | 'novella',
    onFormatSelect: vi.fn(),
    onBack: vi.fn(),
  };

  it('should render all three format options', () => {
    render(<StoryFormatSelector {...defaultProps} />);
    expect(screen.getByText('Story Preview')).toBeInTheDocument();
    expect(screen.getByText('Short Story')).toBeInTheDocument();
    expect(screen.getByText('Novella')).toBeInTheDocument();
  });

  it('should display credit costs', () => {
    render(<StoryFormatSelector {...defaultProps} />);
    expect(screen.getByText('1 credit')).toBeInTheDocument();
    expect(screen.getByText('3 credits')).toBeInTheDocument();
    expect(screen.getByText('5 credits')).toBeInTheDocument();
  });

  it('should display chapter ranges', () => {
    render(<StoryFormatSelector {...defaultProps} />);
    expect(screen.getByText('1 chapter')).toBeInTheDocument();
    expect(screen.getByText('3-6 chapters')).toBeInTheDocument();
    expect(screen.getByText('8-12 chapters')).toBeInTheDocument();
  });

  it('should show Recommended badge on Short Story', () => {
    render(<StoryFormatSelector {...defaultProps} />);
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('should call onFormatSelect when format card clicked', async () => {
    const user = userEvent.setup();
    const onFormatSelect = vi.fn();
    render(<StoryFormatSelector {...defaultProps} onFormatSelect={onFormatSelect} />);

    await user.click(screen.getByText('Story Preview'));
    expect(onFormatSelect).toHaveBeenCalledWith('preview');
  });

  it('should call onFormatSelect when select button clicked', async () => {
    const user = userEvent.setup();
    const onFormatSelect = vi.fn();
    render(<StoryFormatSelector {...defaultProps} onFormatSelect={onFormatSelect} />);

    const buttons = screen.getAllByText('Select This Format');
    await user.click(buttons[0]);
    expect(onFormatSelect).toHaveBeenCalledWith('preview');
  });

  it('should show Selected text when format is selected', () => {
    render(<StoryFormatSelector {...defaultProps} selectedFormat="short-story" />);
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<StoryFormatSelector {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText(/Back to Storyline/));
    expect(onBack).toHaveBeenCalled();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<StoryFormatSelector {...defaultProps} />);
    const results = await axeComponent(container);
    expect(results).toHaveNoViolations();
  });
});
