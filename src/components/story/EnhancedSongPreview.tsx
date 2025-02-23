
import { useState, useEffect } from 'react';
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findRelevantSong } from "@/utils/taylorSwiftSongs";

interface EnhancedSongPreviewProps {
  story: string;
}

export const EnhancedSongPreview = ({ story }: EnhancedSongPreviewProps) => {
  const [showYouTube, setShowYouTube] = useState(false);
  const relevantSong = findRelevantSong(story);

  if (!relevantSong) return null;

  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-purple-800">
            Your Story's Soundtrack: "{relevantSong.title}"
          </h3>
          <Button
            onClick={() => setShowYouTube(!showYouTube)}
            variant="outline"
            className="bg-purple-100 text-purple-700 hover:bg-purple-200"
          >
            <Music className="h-5 w-5 mr-2" />
            {showYouTube ? 'Hide Player' : 'Watch Video'}
          </Button>
        </div>

        <div className="prose prose-pink max-w-none">
          <p className="text-gray-700">{relevantSong.explanation}</p>
        </div>

        {showYouTube && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${relevantSong.youtubeId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {relevantSong.lyrics && (
              <div className="mt-4 p-4 bg-white/50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Key Lyrics:</h4>
                <p className="text-gray-700 italic">
                  {relevantSong.lyrics}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
