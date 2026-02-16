import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axeComponent } from '@/test/a11y-helpers';
import { CharacterSelector } from '../CharacterSelector';

vi.mock('../../types/eras', () => ({
  getCharacterArchetypes: () => [
    { id: 'dreamer', name: 'The Dreamer', description: 'Imaginative and hopeful', traits: ['creative', 'hopeful'] },
    { id: 'rebel', name: 'The Rebel', description: 'Breaks the rules', traits: ['bold', 'defiant'] },
  ],
}));

describe('CharacterSelector', () => {
  const defaultProps = {
    selectedEra: '1989' as const,
    selectedArchetype: null as string | null,
    onArchetypeSelect: vi.fn(),
    onBack: vi.fn(),
    onContinue: vi.fn(),
  };

  it('should render character archetypes', () => {
    render(<CharacterSelector {...defaultProps} />);
    expect(screen.getByText('The Dreamer')).toBeInTheDocument();
    expect(screen.getByText('The Rebel')).toBeInTheDocument();
  });

  it('should display archetype descriptions', () => {
    render(<CharacterSelector {...defaultProps} />);
    expect(screen.getByText('Imaginative and hopeful')).toBeInTheDocument();
    expect(screen.getByText('Breaks the rules')).toBeInTheDocument();
  });

  it('should display archetype traits', () => {
    render(<CharacterSelector {...defaultProps} />);
    expect(screen.getByText('creative')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('should call onArchetypeSelect when card clicked', async () => {
    const user = userEvent.setup();
    const onArchetypeSelect = vi.fn();
    render(<CharacterSelector {...defaultProps} onArchetypeSelect={onArchetypeSelect} />);

    await user.click(screen.getByText('The Dreamer'));
    expect(onArchetypeSelect).toHaveBeenCalledWith('dreamer');
  });

  it('should disable continue button when no archetype selected', () => {
    render(<CharacterSelector {...defaultProps} selectedArchetype={null} />);
    expect(screen.getByText('Continue to Story Details')).toBeDisabled();
  });

  it('should enable continue button when archetype is selected', () => {
    render(<CharacterSelector {...defaultProps} selectedArchetype="dreamer" />);
    expect(screen.getByText('Continue to Story Details')).not.toBeDisabled();
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<CharacterSelector {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText(/Back to Prompts/));
    expect(onBack).toHaveBeenCalled();
  });

  it('should call onContinue when continue button clicked', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<CharacterSelector {...defaultProps} selectedArchetype="dreamer" onContinue={onContinue} />);

    await user.click(screen.getByText('Continue to Story Details'));
    expect(onContinue).toHaveBeenCalled();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<CharacterSelector {...defaultProps} />);
    const results = await axeComponent(container);
    expect(results).toHaveNoViolations();
  });
});
