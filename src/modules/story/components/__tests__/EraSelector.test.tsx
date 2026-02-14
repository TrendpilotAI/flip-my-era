import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EraSelector } from '../EraSelector';

vi.mock('../../types/eras', () => ({
  getAllEras: () => [
    { id: 'showgirl', displayName: 'Showgirl', description: 'Sparkle and shine', imageUrl: '', colorScheme: { gradient: 'bg-pink-500' } },
    { id: '1989', displayName: '1989', description: 'Pop perfection', imageUrl: '', colorScheme: { gradient: 'bg-blue-500' } },
    { id: 'reputation', displayName: 'Reputation', description: 'Dark and edgy', imageUrl: '', colorScheme: { gradient: 'bg-black' } },
  ],
}));

vi.mock('../../data/generatedImages.json', () => ({
  default: { eras: {}, prompts: {} },
}));

describe('EraSelector', () => {
  it('should render all ERA cards', () => {
    render(<EraSelector onEraSelect={vi.fn()} />);
    expect(screen.getByText('Showgirl')).toBeInTheDocument();
    expect(screen.getByText('1989')).toBeInTheDocument();
    expect(screen.getByText('Reputation')).toBeInTheDocument();
  });

  it('should display ERA descriptions', () => {
    render(<EraSelector onEraSelect={vi.fn()} />);
    expect(screen.getByText('Sparkle and shine')).toBeInTheDocument();
    expect(screen.getByText('Pop perfection')).toBeInTheDocument();
  });

  it('should call onEraSelect with ERA id when card clicked', async () => {
    const user = userEvent.setup();
    const onEraSelect = vi.fn();
    render(<EraSelector onEraSelect={onEraSelect} />);

    await user.click(screen.getByText('1989'));
    expect(onEraSelect).toHaveBeenCalledWith('1989');
  });

  it('should render heading text', () => {
    render(<EraSelector onEraSelect={vi.fn()} />);
    expect(screen.getByText('Choose Your Era')).toBeInTheDocument();
  });
});
