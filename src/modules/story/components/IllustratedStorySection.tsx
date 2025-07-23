
import { CreditBasedEbookGenerator } from '@/modules/ebook/components/CreditBasedEbookGenerator';

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
      <CreditBasedEbookGenerator 
        originalStory={story} 
        storyId={storyId}
        useTaylorSwiftThemes={true}
        selectedTheme="coming-of-age"
        selectedFormat="short-story"
        onChaptersGenerated={(chapters) => {
          console.log('Generated chapters:', chapters);
        }}
        onError={(error) => {
          console.error('Generation error:', error);
        }}
      />
    </div>
  );
};
