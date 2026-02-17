import React, { useState, useCallback } from 'react';
import type { ImageStyle, StyleTransferResult } from './types';

const ERA_THEMES: { style: ImageStyle; label: string; description: string }[] = [
  { style: 'retro', label: '🕹️ Retro 80s', description: 'Pixel art vibes, CRT scanlines' },
  { style: 'neon', label: '💜 Neon Synthwave', description: 'Glowing neon, dark backgrounds' },
  { style: 'vintage', label: '📷 Vintage Film', description: 'Faded colors, grain, warm tones' },
  { style: 'watercolor', label: '🎨 Watercolor', description: 'Soft edges, blended pigments' },
  { style: 'comic', label: '💥 Comic Book', description: 'Bold lines, halftone dots' },
  { style: 'art-deco', label: '🏛️ Art Deco', description: 'Geometric patterns, gold accents' },
];

/** Stub API */
async function applyStyleTransfer(sourceUrl: string, style: ImageStyle, intensity: number): Promise<StyleTransferResult> {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    id: crypto.randomUUID(),
    originalUrl: sourceUrl,
    resultUrl: `https://placehold.co/600x400?text=${encodeURIComponent(style)}+${intensity}%25`,
    style,
    intensity,
    status: 'complete',
  };
}

export default function StyleTransfer() {
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('retro');
  const [intensity, setIntensity] = useState(75);
  const [result, setResult] = useState<StyleTransferResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTransfer = useCallback(async () => {
    if (!sourceUrl.trim()) return;
    setLoading(true);
    try {
      const res = await applyStyleTransfer(sourceUrl, selectedStyle, intensity);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [sourceUrl, selectedStyle, intensity]);

  return (
    <div className="container mx-auto py-8 max-w-4xl" data-testid="style-transfer">
      <h1 className="text-3xl font-bold mb-6">🎭 Image Style Transfer</h1>
      <p className="text-muted-foreground mb-6">Apply era-specific visual themes to your images</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              data-testid="source-url-input"
              className="w-full border rounded-lg p-2 bg-background"
              placeholder="https://example.com/image.jpg"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Era Theme</label>
            <div className="space-y-2">
              {ERA_THEMES.map((theme) => (
                <button
                  key={theme.style}
                  data-testid={`theme-${theme.style}`}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedStyle === theme.style ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedStyle(theme.style)}
                >
                  <div className="font-medium">{theme.label}</div>
                  <div className={`text-xs ${selectedStyle === theme.style ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {theme.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Intensity: {intensity}%
            </label>
            <input
              data-testid="intensity-slider"
              type="range"
              min={10}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            data-testid="transfer-btn"
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium disabled:opacity-50"
            onClick={handleTransfer}
            disabled={loading || !sourceUrl.trim()}
          >
            {loading ? 'Applying Style...' : '🎭 Apply Style Transfer'}
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Result</h2>
          {result ? (
            <div className="border rounded-lg overflow-hidden">
              <img src={result.resultUrl} alt={`${result.style} style`} className="w-full" />
              <div className="p-3 text-sm">
                <span className="font-medium">{result.style}</span> · {result.intensity}% intensity
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
              Style transfer result will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
