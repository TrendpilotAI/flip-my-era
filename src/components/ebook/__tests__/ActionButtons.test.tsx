import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const mockOnSave = vi.fn();
  const mockOnPublish = vi.fn();
  const mockOnShare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all action buttons', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    expect(screen.getByRole('button', { name: /save as pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish online/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share story/i })).toBeInTheDocument();
  });

  it('renders correct icons for each button', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    // Look for SVG elements with specific classes
    expect(document.querySelector('svg[class*="save"]')).toBeInTheDocument();
    expect(document.querySelector('svg[class*="globe"]')).toBeInTheDocument();
    expect(document.querySelector('svg[class*="share"]')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /save as pdf/i }));
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('calls onPublish when publish button is clicked', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /publish online/i }));
    expect(mockOnPublish).toHaveBeenCalledTimes(1);
  });

  it('calls onShare when share button is clicked', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /share story/i }));
    expect(mockOnShare).toHaveBeenCalledTimes(1);
  });

  it('disables publish button and shows loading state when isPublishing is true', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={true}
      />
    );
    
    const publishButton = screen.getByRole('button', { name: /publishing/i });
    expect(publishButton).toBeDisabled();
    expect(publishButton).toHaveTextContent('Publishing...');
  });

  it('applies correct background colors to buttons', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    expect(screen.getByRole('button', { name: /save as pdf/i })).toHaveClass('bg-blue-500');
    expect(screen.getByRole('button', { name: /publish online/i })).toHaveClass('bg-purple-500');
    expect(screen.getByRole('button', { name: /share story/i })).toHaveClass('bg-green-500');
  });

  it('applies hover states to buttons', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    expect(screen.getByRole('button', { name: /save as pdf/i })).toHaveClass('hover:bg-blue-600');
    expect(screen.getByRole('button', { name: /publish online/i })).toHaveClass('hover:bg-purple-600');
    expect(screen.getByRole('button', { name: /share story/i })).toHaveClass('hover:bg-green-600');
  });

  it('applies flex layout to button container', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    const container = screen.getByRole('button', { name: /save as pdf/i }).parentElement;
    expect(container).toHaveClass('flex', 'flex-wrap', 'gap-4', 'mt-8');
  });

  it('applies flex-1 to all buttons', () => {
    render(
      <ActionButtons
        onSave={mockOnSave}
        onPublish={mockOnPublish}
        onShare={mockOnShare}
        isPublishing={false}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('flex-1');
    });
  });
}); 