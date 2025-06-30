import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { EbookGenerator } from '../EbookGenerator';
import { generateChapters, generateImage } from '@/services/ai';

// Mock the AI services
vi.mock('@/services/ai', () => ({
  generateChapters: vi.fn(),
  generateImage: vi.fn(),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('EbookGenerator', () => {
  const mockProps = {
    originalStory: 'Once upon a time...',
    storyId: 'test-story-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<EbookGenerator {...mockProps} />);
    
    expect(screen.getByText('Transform Your Story into an Illustrated Book')).toBeInTheDocument();
    expect(screen.getByText(/Our AI will transform your story/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate chapters/i })).toBeInTheDocument();
  });

  it('generates chapters when generate button is clicked', async () => {
    const mockChapters = [
      { title: 'Chapter 1', content: 'Content 1' },
      { title: 'Chapter 2', content: 'Content 2' },
    ];
    
    (generateChapters as any).mockResolvedValue(mockChapters);
    
    render(<EbookGenerator {...mockProps} />);
    
    const generateButton = screen.getByRole('button', { name: /generate chapters/i });
    await userEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Chapters Generated",
        description: "Your story has been transformed into an illustrated book format.",
      });
    });
  });

  it('handles chapter generation error', async () => {
    (generateChapters as any).mockRejectedValue(new Error('Generation failed'));
    
    render(<EbookGenerator {...mockProps} />);
    
    const generateButton = screen.getByRole('button', { name: /generate chapters/i });
    await userEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Generation Failed",
        description: "There was an error generating your chapters. Please try again.",
        variant: "destructive",
      });
    });
  });

  it('generates images for chapters when image generation button is clicked', async () => {
    // First generate chapters
    const mockChapters = [
      { title: 'Chapter 1', content: 'Content 1' },
      { title: 'Chapter 2', content: 'Content 2' },
    ];
    (generateChapters as any).mockResolvedValue(mockChapters);
    
    // Then generate images
    (generateImage as any).mockResolvedValue('https://example.com/image.jpg');
    
    render(<EbookGenerator {...mockProps} />);
    
    // Generate chapters first
    const generateButton = screen.getByRole('button', { name: /generate chapters/i });
    await userEvent.click(generateButton);
    
    // Wait for chapters to appear
    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    });
    
    // Wait for generate images button to appear and click it
    const generateImagesButton = await screen.findByRole('button', { name: /generate images for all chapters/i });
    await userEvent.click(generateImagesButton);
    
    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByText('Generating Illustrations...')).toBeInTheDocument();
    });
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Images Generated!')).toBeInTheDocument();
      expect(generateImage).toHaveBeenCalledTimes(2);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Images Generated",
        description: "Beautiful illustrations have been created for your story.",
      });
    });
  });

  it('handles image generation error gracefully', async () => {
    // First generate chapters
    const mockChapters = [
      { title: 'Chapter 1', content: 'Content 1' },
    ];
    (generateChapters as any).mockResolvedValue(mockChapters);
    
    // Then fail image generation
    (generateImage as any).mockRejectedValue(new Error('Image generation failed'));
    
    render(<EbookGenerator {...mockProps} />);
    
    // Generate chapters first
    const generateButton = screen.getByRole('button', { name: /generate chapters/i });
    await userEvent.click(generateButton);
    
    // Wait for chapter to appear
    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });
    
    // Wait for generate images button to appear and click it
    const generateImagesButton = await screen.findByRole('button', { name: /generate images for all chapters/i });
    await userEvent.click(generateImagesButton);
    
    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByText('Generating Illustrations...')).toBeInTheDocument();
    });
    
    // Wait for error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Image Generation Failed",
        description: "There was an error generating your illustrations. Please try again.",
        variant: "destructive",
      });
    });
  });

  it('displays loading states during generation', async () => {
    (generateChapters as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<EbookGenerator {...mockProps} />);
    
    const generateButton = screen.getByRole('button', { name: /generate chapters/i });
    await userEvent.click(generateButton);
    
    expect(screen.getByRole('button', { name: /generating chapters/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /generating chapters/i })).not.toBeInTheDocument();
    });
  });

  it('handles save, publish, and share actions', async () => {
    // First generate chapters
    const mockChapters = [
      { title: 'Chapter 1', content: 'Content 1' },
    ];
    (generateChapters as any).mockResolvedValue(mockChapters);
    
    render(<EbookGenerator {...mockProps} />);
    
    // Generate chapters
    const generateButton = screen.getByRole('button', { name: /generate chapters/i });
    await userEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });
    
    // Test save button
    const saveButton = screen.getByRole('button', { name: /save as pdf/i });
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Saving PDF",
        description: "Your illustrated story is being prepared for download.",
      });
    });
    
    // Test publish button
    const publishButton = screen.getByRole('button', { name: /publish online/i });
    await userEvent.click(publishButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Story Published",
        description: "Your illustrated story is now available online!",
      });
    });
    
    // Test share button
    const shareButton = screen.getByRole('button', { name: /share story/i });
    await userEvent.click(shareButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Share Your Story",
        description: "Sharing options would appear here in the final implementation.",
      });
    });
  });
}); 