import { Video } from "lucide-react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { shareToTikTok, TIKTOK_TEMPLATES } from "@/modules/story/utils/tiktokShare";

interface TikTokShareSectionProps {
  story: string;
  songUrl?: string;
}

export const TikTokShareSection = ({ story, songUrl }: TikTokShareSectionProps) => {
  const { toast } = useToast();

  const handleTikTokShare = async () => {
    try {
      const songDetails = songUrl ? {
        musicUrl: songUrl,
      } : {};

      await shareToTikTok({
        text: story.slice(0, 300) + "...",
        hashtags: ["alternateTimeline", "whatIf", "storytelling"],
        template: 'story',
        ...songDetails,
      });
      
      toast({
        title: "Opening TikTok",
        description: "Your story video is being created! Add final touches in TikTok.",
      });
    } catch (error) {
      toast({
        title: "Couldn't open TikTok",
        description: "Please try copying the story and sharing manually.",
        variant: "destructive",
      });
    }
  };

  return (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-6 w-6 text-purple-500" />
        <h3 className="text-xl font-semibold text-[#4A4A4A]">
          Share Your Story
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(TIKTOK_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            onClick={() => handleTikTokShare()}
            className="group relative p-6 rounded-xl bg-white border border-purple-100 shadow-sm 
              hover:shadow-md transition-all duration-300 hover:border-purple-200 
              hover:transform hover:-translate-y-1"
          >
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-[#4A4A4A] group-hover:text-purple-600 
                transition-colors">{template.name}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
              <div className="flex items-center gap-2 text-xs text-purple-500 font-medium pt-2">
                <Video className="h-4 w-4" />
                <span>{template.duration}s</span>
              </div>
            </div>
                        <div className="absolute inset-0 bg-gray-500/0
              group-hover:bg-gray-500/5 rounded-xl transition-all 
              duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
};
