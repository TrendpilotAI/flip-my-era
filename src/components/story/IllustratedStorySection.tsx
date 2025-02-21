
import { EbookGenerator } from "@/components/EbookGenerator";

interface IllustratedStorySectionProps {
  story: string;
  storyId: string;
}

export const IllustratedStorySection = ({ story, storyId }: IllustratedStorySectionProps) => {
  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold text-[#4A4A4A] mb-6">
        Create an Illustrated Story
      </h3>
      <EbookGenerator originalStory={story} storyId={storyId} />
    </div>
  );
};
