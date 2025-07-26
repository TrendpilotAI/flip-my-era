import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { artistOptions, artistThemes } from '@/modules/shared/types/artist-themes';
import { Music, ChevronRight, Sparkles } from 'lucide-react';

interface ArtistSurveyProps {
  onArtistSelect: (artistId: string) => void;
}

export const ArtistSurvey = ({ onArtistSelect }: ArtistSurveyProps) => {
  const [selectedArtist, setSelectedArtist] = useState<string>('');

  const handleArtistClick = (artistId: string) => {
    setSelectedArtist(artistId);
  };

  const handleContinue = () => {
    if (selectedArtist) {
      onArtistSelect(selectedArtist);
    }
  };

  const getArtistCardColors = (artistId: string) => {
    const theme = artistThemes[artistId];
    return {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.primary,
      color: theme.colors.cardForeground,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <Card className="bg-white/90 backdrop-blur-lg border border-purple-200 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music className="h-8 w-8 text-purple-500" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Choose Your Musical Inspiration
              </CardTitle>
              <Music className="h-8 w-8 text-purple-500" />
            </div>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select your favorite artist or band to personalize your FlipMyEra experience. 
              This will customize the app's theme, colors, and content just for you!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artistOptions.map((artist) => {
                const theme = artistThemes[artist.id];
                const isSelected = selectedArtist === artist.id;
                
                return (
                  <div
                    key={artist.id}
                    className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      isSelected ? 'scale-105 ring-4 ring-purple-400 ring-opacity-50' : ''
                    }`}
                    onClick={() => handleArtistClick(artist.id)}
                  >
                    <Card 
                      className={`h-full border-2 transition-all duration-300 ${
                        isSelected 
                          ? 'border-purple-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      style={isSelected ? getArtistCardColors(artist.id) : undefined}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="space-y-3">
                          <div 
                            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl transition-all duration-300`}
                            style={{ 
                              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` 
                            }}
                          >
                            {artist.name.split(' ').map(word => word[0]).join('').substring(0, 2)}
                          </div>
                          <h3 className="font-bold text-lg">{artist.name}</h3>
                          <p className="text-sm text-gray-600">{artist.genre}</p>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-4 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center pt-6 border-t border-gray-200">
              <Button
                onClick={handleContinue}
                disabled={!selectedArtist}
                className={`px-8 py-3 text-lg font-semibold transition-all duration-300 ${
                  selectedArtist
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Your Personalized Experience
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              
              {selectedArtist && (
                <p className="mt-3 text-sm text-gray-600">
                  Great choice! You've selected <span className="font-semibold text-purple-600">
                    {artistThemes[selectedArtist].name}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};