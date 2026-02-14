import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryPromptsSelector } from '../StoryPromptsSelector';

vi.mock('../../data/storyPrompts', () => ({
  getPromptsByEra: () => [
    { id: 'prompt-1', title: 'Lost in the City', vibeCheck: 'Urban adventure', genZHook: 'Main character energy', swiftieSignal: 'Like Cornelia Street', imageUrl: '' },
    { id: 'prompt-2', title: 'Midnight Dance', vibeCheck: 'Enchanted evening', genZHook: 'Living for this', swiftieSignal: 'Enchanted vibes', imageUrl: '' },
  ],
}));

vi.mock('../../data/generatedImages.json', () => ({
  default: { eras: {}, prompts: {} },
}));

describe('StoryPromptsSelector', () => {
  const defaultProps = {
    selectedEra: '1989' as const,
    onPromptSelect: vi.fn(),
    onBack: vi.fn(),
    onCreateOwn: vi.fn(),
  };

  it('should render prompts for selected ERA', () => {
    render(<StoryPromptsSelector {...defaultProps} />);
    expect(screen.getByText('Lost in the City')).toBeInTheDocument();
    expect(screen.getByText('Midnight Dance')).toBeInTheDocument();
  });

  it('should render Create Your Own card', () => {
    render(<StoryPromptsSelector {...defaultProps} />);
    expect(screen.getByText('Create Your Own')).toBeInTheDocument();
  });

  it('should call onPromptSelect when prompt clicked', async () => {
    const user = userEvent.setup();
    const onPromptSelect = vi.fn();
    render(<StoryPromptsSelector {...defaultProps} onPromptSelect={onPromptSelect} />);

    await user.click(screen.getByText('Lost in the City'));
    expect(onPromptSelect).toHaveBeenCalledWith('prompt-1');
  });

  it('should call onCreateOwn when create card clicked', async () => {
    const user = userEvent.setup();
    const onCreateOwn = vi.fn();
    render(<StoryPromptsSelector {...defaultProps} onCreateOwn={onCreateOwn} />);

    await user.click(screen.getByText('Create Your Own'));
    expect(onCreateOwn).toHaveBeenCalled();
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<StoryPromptsSelector {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText(/Back to Eras/));
    expect(onBack).toHaveBeenCalled();
  });
});
