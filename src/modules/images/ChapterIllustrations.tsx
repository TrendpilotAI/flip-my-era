import React, { useState, useCallback } from 'react';
import type { ImageStyle, ChapterIllustration } from './types';

/** Stub: extracts key scenes from chapter text and generates illustrations */
async function generateIllustrations(
  chapterText: string,
  style: ImageStyle,
  count: number
): Promise<ChapterIllustration[]> {
  await new Promise((r) => setTimeout(r, 2000));
  const words = chapterText.split(/\s+/).slice(0, 5).join(' ');
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    chapterId: 'chapter-1',
    url: `https://placehold.co/512x512?text=Illustration+${i + 1}`,
    caption: `Scene ${i + 1}: ${words}...`,
    style,
    status: 'complete' as const,
  }));
}

const STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: 'watercolor', label: '🎨 Watercolor' },
  { value: 'comic', label: '💥 Comic' },
  { value: 'vintage', label: '📷 Vintage' },
  { value: 'minimalist', label: '⬜ Minimalist' },
  { value: 'photorealistic', label: '📸 Photorealistic' },
];

export default function ChapterIllustrations() {
  const [chapterText, setChapterText] = useState('');
  const [style, setStyle] = useState<ImageStyle>('watercolor');
  const [count, setCount] = useState(3);
  const [illustrations, setIllustrations] = useState<ChapterIllustration[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!chapterText.trim()) return;
    setLoading(true);
    try {
      const results = await generateIllustrations(chapterText, style, count);
      setIllustrations(results);
    } finally {
      setLoading(false);
    }
  }, [chapterText, style, count]);

  return (
    <div className="container mx-auto py-8 max-w-4xl" data-testid="chapter-illustrations">
      <h1 className="text-3xl font-bold mb-6">🖼️ Chapter Illustrations</h1>
      <p className="text-muted-foreground mb-6">Auto-generate illustrations from your chapter text</p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Chapter Text</label>
          <textarea
            data-testid="chapter-text-input"
            className="w-full border rounded-lg p-3 min-h-[150px] bg-background"
            placeholder="Paste your chapter text here..."
            value={chapterText}
            onChange={(e) => setChapterText(e.target.value)}
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Style</label>
            <select
              data-testid="illustration-style"
              className="w-full border rounded-lg p-2 bg-background"
              value={style}
              onChange={(e) => setStyle(e.target.value as ImageStyle)}
            >
              {STYLE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Count</label>
            <select
              data-testid="illustration-count"
              className="w-full border rounded-lg p-2 bg-background"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          data-testid="generate-illustrations-btn"
          className="bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium disabled:opacity-50"
          onClick={handleGenerate}
          disabled={loading || !chapterText.trim()}
        >
          {loading ? 'Generating...' : `🖼️ Generate ${count} Illustration${count > 1 ? 's' : ''}`}
        </button>
      </div>

      {illustrations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Generated Illustrations</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {illustrations.map((ill) => (
              <div key={ill.id} className="border rounded-lg overflow-hidden" data-testid="illustration-card">
                <img src={ill.url} alt={ill.caption} className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <p className="text-sm text-muted-foreground">{ill.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
