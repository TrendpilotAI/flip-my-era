import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { GenerateButton } from '../GenerateButton';

describe('GenerateButton', () => {
  const mockOnClick = vi.fn();

  describe('Chapters Button', () => {
    it('renders chapters button in default state', () => {
      render(
        <GenerateButton
          type="chapters"
          onClick={mockOnClick}
          isGenerating={false}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Generate Chapters');
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-6', 'w-6');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('renders chapters button in generating state', () => {
      render(
        <GenerateButton
          type="chapters"
          onClick={mockOnClick}
          isGenerating={true}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Generating Chapters...');
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onClick when clicked in default state', () => {
      render(
        <GenerateButton
          type="chapters"
          onClick={mockOnClick}
          isGenerating={false}
        />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when clicked in generating state', () => {
      render(
        <GenerateButton
          type="chapters"
          onClick={mockOnClick}
          isGenerating={true}
        />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Images Button', () => {
    it('renders images button in default state', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={false}
          hasImages={false}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Generate Images for All Chapters');
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-6', 'w-6');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('renders images button in generating state', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={true}
          hasImages={false}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Generating Illustrations...');
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('renders images button in completed state', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={false}
          hasImages={true}
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Images Generated!');
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onClick when clicked in default state', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={false}
          hasImages={false}
        />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when clicked in generating state', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={true}
          hasImages={false}
        />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when clicked in completed state', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={false}
          hasImages={true}
        />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('applies correct gradient classes', () => {
      render(
        <GenerateButton
          type="images"
          onClick={mockOnClick}
          isGenerating={false}
          hasImages={false}
        />
      );
      
      expect(screen.getByRole('button')).toHaveClass(
        'bg-gradient-to-r',
        'from-green-500',
        'to-blue-500'
      );
    });
  });
}); 