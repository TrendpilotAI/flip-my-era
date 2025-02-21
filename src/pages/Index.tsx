
import { SparkleEffect } from "@/components/SparkleEffect";
import { BackgroundImages } from "@/components/BackgroundImages";
import { PageHeader } from "@/components/PageHeader";
import { StoryForm } from "@/components/StoryForm";
import { StoryResult } from "@/components/StoryResult";
import { useApiCheck } from "@/hooks/useApiCheck";
import { useStoryGeneration } from "@/hooks/useStoryGeneration";
import { personalityTypes } from "@/types/personality";

const Index = () => {
  useApiCheck();
  const {
    name,
    setName,
    date,
    setDate,
    loading,
    result,
    personalityType,
    setPersonalityType,
    storyId,
    handleStorySelect,
    handleSubmit
  } = useStoryGeneration();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-12 px-4 relative overflow-hidden">
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <PageHeader />

        <StoryForm
          name={name}
          setName={setName}
          date={date}
          setDate={setDate}
          loading={loading}
          handleSubmit={handleSubmit}
          handleStorySelect={handleStorySelect}
          personalityTypes={personalityTypes}
          personalityType={personalityType}
          setPersonalityType={setPersonalityType}
        />

        {result && (
          <StoryResult
            result={result}
            storyId={storyId}
            onRegenerateClick={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
