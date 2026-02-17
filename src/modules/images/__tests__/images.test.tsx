import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import CoverArtGenerator from '../CoverArtGenerator';
import StyleTransfer from '../StyleTransfer';
import ChapterIllustrations from '../ChapterIllustrations';
import ImageEditor from '../ImageEditor';
import AssetLibrary from '../AssetLibrary';

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => Math.random().toString(36).slice(2) },
  });
}

describe('CoverArtGenerator', () => {
  it('renders the generator UI', () => {
    render(<CoverArtGenerator />);
    expect(screen.getByTestId('cover-art-generator')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-input')).toBeInTheDocument();
    expect(screen.getByTestId('generate-btn')).toBeDisabled();
  });

  it('enables generate button when prompt is entered', () => {
    render(<CoverArtGenerator />);
    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'A magical forest' } });
    expect(screen.getByTestId('generate-btn')).not.toBeDisabled();
  });

  it('generates cover art on click', async () => {
    render(<CoverArtGenerator />);
    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'A dragon' } });
    fireEvent.click(screen.getByTestId('generate-btn'));
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Generating...')).not.toBeInTheDocument(), { timeout: 3000 });
  });
});

describe('StyleTransfer', () => {
  it('renders the style transfer UI', () => {
    render(<StyleTransfer />);
    expect(screen.getByTestId('style-transfer')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-btn')).toBeDisabled();
  });

  it('enables transfer when URL is provided', () => {
    render(<StyleTransfer />);
    fireEvent.change(screen.getByTestId('source-url-input'), { target: { value: 'https://example.com/img.jpg' } });
    expect(screen.getByTestId('transfer-btn')).not.toBeDisabled();
  });
});

describe('ChapterIllustrations', () => {
  it('renders and generates illustrations', async () => {
    render(<ChapterIllustrations />);
    expect(screen.getByTestId('chapter-illustrations')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('chapter-text-input'), { target: { value: 'The hero walked into the dark forest' } });
    fireEvent.click(screen.getByTestId('generate-illustrations-btn'));
    await waitFor(() => expect(screen.getAllByTestId('illustration-card')).toHaveLength(3), { timeout: 4000 });
  });
});

describe('ImageEditor', () => {
  it('renders the editor with filter controls', () => {
    render(<ImageEditor />);
    expect(screen.getByTestId('image-editor')).toBeInTheDocument();
    expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
    expect(screen.getByTestId('filter-brightness')).toBeInTheDocument();
  });

  it('switches tabs', () => {
    render(<ImageEditor />);
    fireEvent.click(screen.getByTestId('tab-text'));
    expect(screen.getByTestId('text-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tab-crop'));
    expect(screen.getByTestId('crop-panel')).toBeInTheDocument();
  });
});

describe('AssetLibrary', () => {
  it('renders all assets by default', () => {
    render(<AssetLibrary />);
    expect(screen.getByTestId('asset-library')).toBeInTheDocument();
    expect(screen.getAllByTestId('asset-card').length).toBe(12);
  });

  it('filters by category', () => {
    render(<AssetLibrary />);
    fireEvent.click(screen.getByTestId('category-stickers'));
    expect(screen.getAllByTestId('asset-card').length).toBe(3);
  });

  it('filters by search', () => {
    render(<AssetLibrary />);
    fireEvent.change(screen.getByTestId('asset-search'), { target: { value: 'crown' } });
    expect(screen.getAllByTestId('asset-card').length).toBe(1);
  });
});
