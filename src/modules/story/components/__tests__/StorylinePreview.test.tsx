import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorylinePreview } from '../StorylinePreview';
import type { Storyline } from '../../services/storylineGeneration';

// Mock storylineGeneration to avoid pulling in supabase/sentry/posthog
vi.mock('../../services/storylineGeneration', () => ({}));

const mockStoryline: Storyline = {
  logline: 'A dreamer discovers her voice in the city lights',
  threeActStructure: {
    act1: { setup: 'Arriving in NYC', incitingIncident: 'The audition', firstPlotPoint: 'Gets the part' },
    act2: { risingAction: 'Rehearsals begin', midpoint: 'Stage fright', darkNightOfTheSoul: 'Almost quits' },
    act3: { climax: 'Opening night', resolution: 'Standing ovation', closingImage: 'City skyline' },
  },
  chapters: [
    { number: 1, title: 'New Beginnings', summary: 'Arriving in the city', wordCountTarget: 1500 },
    { number: 2, title: 'The Stage', summary: 'Finding her place', wordCountTarget: 2000 },
  ],
  themes: ['courage', 'self-discovery', 'friendship'],
  wordCountTotal: 3500,
};

describe('StorylinePreview', () => {
  const defaultProps = {
    storyline: mockStoryline,
    onBack: vi.fn(),
    onRegenerate: vi.fn(),
    onEdit: vi.fn(),
    onContinue: vi.fn(),
  };

  it('should render the logline', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText(/A dreamer discovers her voice/)).toBeInTheDocument();
  });

  it('should render three-act structure', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText('Act 1: Setup')).toBeInTheDocument();
    expect(screen.getByText('Act 2: Confrontation')).toBeInTheDocument();
    expect(screen.getByText('Act 3: Resolution')).toBeInTheDocument();
  });

  it('should render act details', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText('Arriving in NYC')).toBeInTheDocument();
    expect(screen.getByText('Stage fright')).toBeInTheDocument();
    expect(screen.getByText('Opening night')).toBeInTheDocument();
  });

  it('should render chapter list with titles and summaries', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText(/Chapter 1: New Beginnings/)).toBeInTheDocument();
    expect(screen.getByText('Arriving in the city')).toBeInTheDocument();
    expect(screen.getByText(/Chapter 2: The Stage/)).toBeInTheDocument();
    expect(screen.getByText('Finding her place')).toBeInTheDocument();
  });

  it('should display word count targets', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText(/~1500 words/)).toBeInTheDocument();
    expect(screen.getByText(/~2000 words/)).toBeInTheDocument();
  });

  it('should display total word count', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText(/3,500/)).toBeInTheDocument();
  });

  it('should render themes', () => {
    render(<StorylinePreview {...defaultProps} />);
    expect(screen.getByText('courage')).toBeInTheDocument();
    expect(screen.getByText('self-discovery')).toBeInTheDocument();
    expect(screen.getByText('friendship')).toBeInTheDocument();
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<StorylinePreview {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText(/Back to Details/));
    expect(onBack).toHaveBeenCalled();
  });

  it('should call onRegenerate when regenerate button clicked', async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    render(<StorylinePreview {...defaultProps} onRegenerate={onRegenerate} />);

    await user.click(screen.getByText('Regenerate'));
    expect(onRegenerate).toHaveBeenCalled();
  });

  it('should call onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<StorylinePreview {...defaultProps} onEdit={onEdit} />);

    await user.click(screen.getByText('Edit Details'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('should call onContinue when continue button clicked', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<StorylinePreview {...defaultProps} onContinue={onContinue} />);

    await user.click(screen.getByText(/Continue to Format/));
    expect(onContinue).toHaveBeenCalled();
  });

  it('should show regenerating state', () => {
    render(<StorylinePreview {...defaultProps} isRegenerating={true} />);
    expect(screen.getByText('Regenerating...')).toBeInTheDocument();
  });

  it('should disable regenerate button when regenerating', () => {
    render(<StorylinePreview {...defaultProps} isRegenerating={true} />);
    expect(screen.getByText('Regenerating...').closest('button')).toBeDisabled();
  });
});
