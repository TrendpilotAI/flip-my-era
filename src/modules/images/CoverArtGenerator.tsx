import React, { useState, useCallback } from 'react';
import type { ImageStyle, CoverSize, GeneratedImage, GenerationRequest } from './types';

const STYLES: { value: ImageStyle; label: string }[] = [
  { value: 'retro', label: '🕹️ Retro' },
  { value: 'neon', label: '💜 Neon' },
  { value: 'vintage', label: '📷 Vintage' },
  { value: 'watercolor', label: '🎨 Watercolor' },
  { value: 'comic', label: '💥 Comic' },
  { value: 'minimalist', label: '⬜ Minimalist' },
  { value: 'photorealistic', label: '📸 Photorealistic' },
  { value: 'art-deco', label: '🏛️ Art Deco' },
];

const SIZES: { value: CoverSize; label: string }[] = [
  { value: '6x9', label: '6×9 (Standard)' },
  { value: '5x8', label: '5×8 (Compact)' },
  { value: '8.5x11', label: '8.5×11 (Large)' },
  { value: 'square', label: 'Square' },
];

/** Stub: simulates API call to DALL-E / Stable Diffusion */
async function generateCoverArt(req: GenerationRequest): Promise<GeneratedImage> {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    id: crypto.randomUUID(),
    url: `https://placehold.co/600x900?text=${encodeURIComponent(req.style)}`,
    prompt: req.prompt,
    style: req.style,
    size: req.size,
    createdAt: new Date().toISOString(),
    status: 'complete',
  };
}

export default function CoverArtGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('retro');
  const [size, setSize] = useState<CoverSize>('6x9');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const img = await generateCoverArt({ prompt, style, size, negativePrompt: negativePrompt || undefined });
      setResults((prev) => [img, ...prev]);
    } finally {
      setLoading(false);
    }
  }, [prompt, style, size, negativePrompt]);

  return (
    <div className="container mx-auto py-8 max-w-4xl" data-testid="cover-art-generator">
      <h1 className="text-3xl font-bold mb-6">🎨 AI Cover Art Generator</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Describe your cover</label>
            <textarea
              data-testid="prompt-input"
              className="w-full border rounded-lg p-3 min-h-[100px] bg-background"
              placeholder="A mystical forest at twilight with glowing mushrooms..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Style</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  data-testid={`style-${s.value}`}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    style === s.value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setStyle(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <select
              data-testid="size-select"
              className="w-full border rounded-lg p-2 bg-background"
              value={size}
              onChange={(e) => setSize(e.target.value as CoverSize)}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Negative prompt (optional)</label>
            <input
              data-testid="negative-prompt"
              className="w-full border rounded-lg p-2 bg-background"
              placeholder="blurry, low quality..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          <button
            data-testid="generate-btn"
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium disabled:opacity-50"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : '✨ Generate Cover Art'}
          </button>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Generated Covers</h2>
          {results.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
              Your generated covers will appear here
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((img) => (
                <div key={img.id} className="border rounded-lg overflow-hidden">
                  <img src={img.url} alt={img.prompt} className="w-full" />
                  <div className="p-3 text-sm">
                    <span className="font-medium">{img.style}</span> · {img.size}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
