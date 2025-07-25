import { Music } from "lucide-react";
import { useEffect, useRef } from "react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { findRelevantSong, openSongInPreferredPlatform } from "@/modules/story/utils/taylorSwiftSongs";

interface SongPreviewSectionProps {
  story: string;
}

export const SongPreviewSection = ({ story }: SongPreviewSectionProps) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const relevantSong = findRelevantSong(story);

  useEffect(() => {
    if (relevantSong) {
      audioRef.current = new Audio(relevantSong.previewUrl);
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(error => {
        console.log("Autoplay prevented:", error);
        toast({
          title: "Music Available",
          description: `Click to play "${relevantSong.title}" which matches your story's mood!`,
        });
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [story, relevantSong]);

  if (!relevantSong) return null;

  return (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-gray-600">{relevantSong.mood}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (audioRef.current?.paused) {
                  audioRef.current?.play();
                } else {
                  audioRef.current?.pause();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              <Music className="h-5 w-5" />
              <span className="font-medium">Preview</span>
            </button>
            <button
              onClick={() => openSongInPreferredPlatform(relevantSong)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <Music className="h-5 w-5" />
              <span className="font-semibold">Listen to "{relevantSong.title}"</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
