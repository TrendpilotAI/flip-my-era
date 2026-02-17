import React, { useState } from 'react';
import { ARTIST_TEMPLATES, type ArtistTemplate, type ArtistEra } from './templateConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { CustomTemplate } from './CustomTemplate';

interface TemplateSelectorProps {
  onSelectEra?: (artistId: string, era: ArtistEra) => void;
  onSelectArtist?: (template: ArtistTemplate) => void;
}

export function TemplateSelector({ onSelectEra, onSelectArtist }: TemplateSelectorProps) {
  const [selectedArtist, setSelectedArtist] = useState<ArtistTemplate | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  if (showCustom) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setShowCustom(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to artists
        </Button>
        <CustomTemplate
          onSave={(template) => {
            onSelectArtist?.(template);
            setShowCustom(false);
          }}
        />
      </div>
    );
  }

  if (selectedArtist) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedArtist(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to artists
        </Button>
        <h2 className="text-2xl font-bold">{selectedArtist.name} — Choose an Era</h2>
        <p className="text-muted-foreground">{selectedArtist.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedArtist.themes.map((theme) => (
            <Badge key={theme} variant="secondary">{theme}</Badge>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedArtist.eras.map((era) => (
            <Card
              key={era.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => onSelectEra?.(selectedArtist.artistId, era)}
            >
              <CardHeader className="pb-2">
                <div
                  className={`h-2 w-full rounded-full bg-gradient-to-r ${era.colorScheme.gradient}`}
                />
                <CardTitle className="text-lg mt-2">{era.displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{era.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {era.characterArchetypes.slice(0, 3).map((arch) => (
                    <Badge key={arch.id} variant="outline" className="text-xs">
                      {arch.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Choose Your Artist</h2>
      <p className="text-muted-foreground">Pick an artist to explore their eras, or create your own</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ARTIST_TEMPLATES.map((template) => (
          <Card
            key={template.artistId}
            className="cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
            onClick={() => {
              if (template.artistId === 'custom') {
                setShowCustom(true);
              } else {
                setSelectedArtist(template);
                onSelectArtist?.(template);
              }
            }}
          >
            <CardHeader>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
              {template.eras.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {template.eras.length} era{template.eras.length !== 1 ? 's' : ''} available
                </p>
              )}
              {template.artistId === 'custom' && (
                <p className="text-xs text-primary font-medium">✨ Create your own</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TemplateSelector;
