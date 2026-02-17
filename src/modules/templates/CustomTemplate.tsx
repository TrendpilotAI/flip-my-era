import React, { useState } from 'react';
import type { ArtistTemplate, ArtistEra } from './templateConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface CustomTemplateProps {
  onSave: (template: ArtistTemplate) => void;
}

function emptyEra(): ArtistEra {
  return {
    id: `custom-era-${Date.now()}`,
    name: '',
    displayName: '',
    description: '',
    colorScheme: { primary: '#6366f1', secondary: '#a855f7', gradient: 'from-indigo-500 to-purple-500' },
    characterArchetypes: [],
    imageUrl: '',
  };
}

export function CustomTemplate({ onSave }: CustomTemplateProps) {
  const [artistName, setArtistName] = useState('');
  const [description, setDescription] = useState('');
  const [themes, setThemes] = useState('');
  const [eras, setEras] = useState<ArtistEra[]>([emptyEra()]);

  const addEra = () => setEras((prev) => [...prev, emptyEra()]);
  const removeEra = (idx: number) => setEras((prev) => prev.filter((_, i) => i !== idx));
  const updateEra = (idx: number, patch: Partial<ArtistEra>) =>
    setEras((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  const handleSave = () => {
    const template: ArtistTemplate = {
      artistId: `custom-${Date.now()}`,
      name: artistName || 'My Artist',
      imageUrl: '',
      description: description || 'Custom artist template',
      eras: eras.filter((e) => e.displayName.trim()),
      themes: themes.split(',').map((t) => t.trim()).filter(Boolean),
      colorPalettes: [],
    };
    onSave(template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Artist Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="artist-name">Artist Name</Label>
          <Input
            id="artist-name"
            placeholder="e.g. Olivia Rodrigo"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist-desc">Description</Label>
          <Textarea
            id="artist-desc"
            placeholder="Brief description of the artist..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="themes">Themes (comma-separated)</Label>
          <Input
            id="themes"
            placeholder="e.g. Heartbreak, Revenge, Growing up"
            value={themes}
            onChange={(e) => setThemes(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Eras</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEra}>
              <Plus className="h-4 w-4 mr-1" /> Add Era
            </Button>
          </div>

          {eras.map((era, idx) => (
            <Card key={era.id} className="border-dashed">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Era {idx + 1}</Label>
                  {eras.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEra(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Era name (e.g. SOUR)"
                  value={era.displayName}
                  onChange={(e) =>
                    updateEra(idx, {
                      displayName: e.target.value,
                      name: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                />
                <Textarea
                  placeholder="Era description..."
                  value={era.description}
                  onChange={(e) => updateEra(idx, { description: e.target.value })}
                  rows={2}
                />
                <div className="flex gap-2">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Primary Color</Label>
                    <Input
                      type="color"
                      value={era.colorScheme.primary}
                      onChange={(e) =>
                        updateEra(idx, {
                          colorScheme: { ...era.colorScheme, primary: e.target.value },
                        })
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Secondary Color</Label>
                    <Input
                      type="color"
                      value={era.colorScheme.secondary}
                      onChange={(e) =>
                        updateEra(idx, {
                          colorScheme: { ...era.colorScheme, secondary: e.target.value },
                        })
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleSave} className="w-full" disabled={!artistName.trim()}>
          Save Template
        </Button>
      </CardContent>
    </Card>
  );
}

export default CustomTemplate;
