import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axeComponent } from '@/test/a11y-helpers';
import { StoryDetailsForm } from '../StoryDetailsForm';

describe('StoryDetailsForm', () => {
  const defaultProps = {
    characterName: '',
    setCharacterName: vi.fn(),
    selectedArchetype: { id: 'dreamer', name: 'The Dreamer', description: 'Imaginative', traits: ['creative'] },
    gender: 'same' as const,
    setGender: vi.fn(),
    location: '',
    setLocation: vi.fn(),
    isCustomPrompt: false,
    onBack: vi.fn(),
    onGenerate: vi.fn(),
    isGenerating: false,
  };

  it('should render form fields', () => {
    render(<StoryDetailsForm {...defaultProps} />);
    expect(screen.getByLabelText(/Character Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Story Location/)).toBeInTheDocument();
  });

  it('should display selected archetype', () => {
    render(<StoryDetailsForm {...defaultProps} />);
    expect(screen.getByText(/The Dreamer/)).toBeInTheDocument();
  });

  it('should disable generate button when fields are empty', () => {
    render(<StoryDetailsForm {...defaultProps} />);
    expect(screen.getByText('Generate Storyline')).toBeDisabled();
  });

  it('should enable generate button when name and location are filled', () => {
    render(<StoryDetailsForm {...defaultProps} characterName="Taylor" location="Nashville" />);
    expect(screen.getByText('Generate Storyline')).not.toBeDisabled();
  });

  it('should call setCharacterName on input', async () => {
    const user = userEvent.setup();
    const setCharacterName = vi.fn();
    render(<StoryDetailsForm {...defaultProps} setCharacterName={setCharacterName} />);

    await user.type(screen.getByLabelText(/Character Name/), 'T');
    expect(setCharacterName).toHaveBeenCalled();
  });

  it('should call setLocation on input', async () => {
    const user = userEvent.setup();
    const setLocation = vi.fn();
    render(<StoryDetailsForm {...defaultProps} setLocation={setLocation} />);

    await user.type(screen.getByLabelText(/Story Location/), 'N');
    expect(setLocation).toHaveBeenCalled();
  });

  it('should show custom prompt textarea when isCustomPrompt is true', () => {
    render(<StoryDetailsForm {...defaultProps} isCustomPrompt={true} setCustomPrompt={vi.fn()} customPrompt="" />);
    expect(screen.getByLabelText(/Your Story Prompt/)).toBeInTheDocument();
  });

  it('should not show custom prompt textarea when isCustomPrompt is false', () => {
    render(<StoryDetailsForm {...defaultProps} isCustomPrompt={false} />);
    expect(screen.queryByLabelText(/Your Story Prompt/)).not.toBeInTheDocument();
  });

  it('should require custom prompt when isCustomPrompt is true', () => {
    render(<StoryDetailsForm {...defaultProps} characterName="Taylor" location="Nashville" isCustomPrompt={true} setCustomPrompt={vi.fn()} customPrompt="" />);
    expect(screen.getByText('Generate Storyline')).toBeDisabled();
  });

  it('should enable generate when custom prompt is filled', () => {
    render(<StoryDetailsForm {...defaultProps} characterName="Taylor" location="Nashville" isCustomPrompt={true} setCustomPrompt={vi.fn()} customPrompt="My story idea" />);
    expect(screen.getByText('Generate Storyline')).not.toBeDisabled();
  });

  it('should show generating state', () => {
    render(<StoryDetailsForm {...defaultProps} characterName="Taylor" location="Nashville" isGenerating={true} />);
    expect(screen.getByText('Generating Storyline...')).toBeInTheDocument();
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<StoryDetailsForm {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText(/Back to Character/));
    expect(onBack).toHaveBeenCalled();
  });

  it('should call onGenerate when generate button clicked', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    render(<StoryDetailsForm {...defaultProps} characterName="Taylor" location="Nashville" onGenerate={onGenerate} />);

    await user.click(screen.getByText('Generate Storyline'));
    expect(onGenerate).toHaveBeenCalled();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<StoryDetailsForm {...defaultProps} />);
    const results = await axeComponent(container);
    expect(results).toHaveNoViolations();
  });
});
