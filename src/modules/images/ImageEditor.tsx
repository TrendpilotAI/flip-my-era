import React, { useState, useCallback } from 'react';
import type { FilterType, ImageFilter, TextOverlay, EditorState } from './types';

const FILTER_PRESETS: { type: FilterType; label: string; min: number; max: number; default: number }[] = [
  { type: 'brightness', label: '☀️ Brightness', min: 0, max: 200, default: 100 },
  { type: 'contrast', label: '🔲 Contrast', min: 0, max: 200, default: 100 },
  { type: 'saturation', label: '🌈 Saturation', min: 0, max: 200, default: 100 },
  { type: 'blur', label: '💨 Blur', min: 0, max: 20, default: 0 },
  { type: 'sepia', label: '🟤 Sepia', min: 0, max: 100, default: 0 },
  { type: 'grayscale', label: '⬛ Grayscale', min: 0, max: 100, default: 0 },
];

function buildCssFilter(filters: ImageFilter[]): string {
  return filters
    .map((f) => {
      switch (f.type) {
        case 'blur': return `blur(${f.value}px)`;
        case 'brightness': return `brightness(${f.value}%)`;
        case 'contrast': return `contrast(${f.value}%)`;
        case 'saturation': return `saturate(${f.value}%)`;
        case 'sepia': return `sepia(${f.value}%)`;
        case 'grayscale': return `grayscale(${f.value}%)`;
        default: return '';
      }
    })
    .join(' ');
}

export default function ImageEditor() {
  const [imageUrl, setImageUrl] = useState('https://placehold.co/800x600?text=Your+Image');
  const [filters, setFilters] = useState<ImageFilter[]>(
    FILTER_PRESETS.map((p) => ({ type: p.type, value: p.default }))
  );
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<'filters' | 'text' | 'crop'>('filters');

  const updateFilter = useCallback((type: FilterType, value: number) => {
    setFilters((prev) => prev.map((f) => (f.type === type ? { ...f, value } : f)));
  }, []);

  const addTextOverlay = useCallback(() => {
    setTextOverlays((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: 'New Text',
        x: 50,
        y: 50,
        fontSize: 24,
        color: '#ffffff',
        fontFamily: 'Arial',
      },
    ]);
  }, []);

  const updateOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(FILTER_PRESETS.map((p) => ({ type: p.type, value: p.default })));
    setRotation(0);
  }, []);

  const cssFilter = buildCssFilter(filters);

  return (
    <div className="container mx-auto py-8 max-w-5xl" data-testid="image-editor">
      <h1 className="text-3xl font-bold mb-6">✏️ Image Editor</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="md:col-span-2">
          <div className="border rounded-lg overflow-hidden bg-gray-100 relative">
            <img
              data-testid="editor-preview"
              src={imageUrl}
              alt="Editor preview"
              className="w-full"
              style={{ filter: cssFilter, transform: `rotate(${rotation}deg)` }}
            />
            {textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  fontSize: overlay.fontSize,
                  color: overlay.color,
                  fontFamily: overlay.fontFamily,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {overlay.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              data-testid="image-url-input"
              className="flex-1 border rounded-lg p-2 bg-background text-sm"
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <button
              data-testid="rotate-btn"
              className="px-3 py-2 border rounded-lg hover:bg-muted"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              🔄
            </button>
            <button
              data-testid="reset-btn"
              className="px-3 py-2 border rounded-lg hover:bg-muted"
              onClick={resetFilters}
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Controls */}
        <div>
          <div className="flex gap-1 mb-4">
            {(['filters', 'text', 'crop'] as const).map((tab) => (
              <button
                key={tab}
                data-testid={`tab-${tab}`}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'filters' && (
            <div className="space-y-3" data-testid="filters-panel">
              {FILTER_PRESETS.map((preset) => {
                const current = filters.find((f) => f.type === preset.type);
                return (
                  <div key={preset.type}>
                    <label className="text-sm font-medium flex justify-between">
                      {preset.label}
                      <span className="text-muted-foreground">{current?.value ?? preset.default}</span>
                    </label>
                    <input
                      type="range"
                      min={preset.min}
                      max={preset.max}
                      value={current?.value ?? preset.default}
                      onChange={(e) => updateFilter(preset.type, Number(e.target.value))}
                      className="w-full"
                      data-testid={`filter-${preset.type}`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3" data-testid="text-panel">
              <button
                data-testid="add-text-btn"
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm"
                onClick={addTextOverlay}
              >
                + Add Text Overlay
              </button>
              {textOverlays.map((overlay) => (
                <div key={overlay.id} className="border rounded-lg p-3 space-y-2">
                  <input
                    className="w-full border rounded p-1 text-sm bg-background"
                    value={overlay.text}
                    onChange={(e) => updateOverlay(overlay.id, { text: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={overlay.color}
                      onChange={(e) => updateOverlay(overlay.id, { color: e.target.value })}
                      className="w-8 h-8"
                    />
                    <input
                      type="number"
                      value={overlay.fontSize}
                      onChange={(e) => updateOverlay(overlay.id, { fontSize: Number(e.target.value) })}
                      className="w-16 border rounded p-1 text-sm bg-background"
                    />
                    <button
                      className="ml-auto text-red-500 text-sm"
                      onClick={() => removeOverlay(overlay.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="text-center py-8 text-muted-foreground" data-testid="crop-panel">
              <p>🔲 Crop tool</p>
              <p className="text-sm mt-2">Click and drag on the image to select crop area</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
