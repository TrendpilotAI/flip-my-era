import { useState } from 'react';
import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { PageHeader } from "@/modules/shared/components/PageHeader";
import StoryWizard from "@/modules/story/components/StoryWizard";
import { StoryResult } from "@/modules/story/components/StoryResult";
import { useApiCheck } from '@/modules/shared/hooks/useApiCheck';
import { useStoryGeneration } from '@/modules/story/hooks/useStoryGeneration';
import { personalityTypes } from '@/modules/story/types/personality';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { Button } from "@/modules/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { BookOpen, Sparkles, User, Star } from "lucide-react";

const Index = () => {
  useApiCheck();
  const { isAuthenticated } = useClerkAuth();
  const [showStoryResult, setShowStoryResult] = useState(false);
  const {
    name,
    setName,
    date,
    setDate,
    loading,
    result,
    storyId,
    personalityType,
    setPersonalityType,
    gender,
    setGender,
    location,
    setLocation,
    characterDescription,
    setCharacterDescription,
    plotDescription,
    setPlotDescription,
    handleStorySelect,
    handleSubmit,
    handleUndo
  } = useStoryGeneration(false); // Don't load saved story automatically

  // Handle story generation with result display
  const handleStoryGeneration = async () => {
    await handleSubmit();
    setShowStoryResult(true);
  };

  // Handle undo to hide story result
  const handleUndoWithHide = () => {
    // Don't call handleUndo as it would restore the previous story
    // Just hide the result and let user start fresh with planning
    setShowStoryResult(false);
  };

  return (
          <div className="min-h-screen bg-white py-12 px-4 relative overflow-hidden">
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <PageHeader />

        {/* Call-to-action for non-authenticated users */}
        {!isAuthenticated && (
          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Unlock Your Full Potential
                <Sparkles className="h-6 w-6 text-purple-500" />
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Sign up to save your stories, access your personal dashboard, and unlock premium features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <span>Save & organize stories</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <User className="h-4 w-4 text-pink-500" />
                  <span>Personal dashboard</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Star className="h-4 w-4 text-blue-500" />
                  <span>Premium features</span>
                </div>
              </div>
              <div className="flex justify-center">
                <AuthDialog
                  trigger={
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Started - It's Free!
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show StoryWizard when not showing result or when there's no result */}
        {(!showStoryResult || !result) && (
          <StoryWizard
            name={name}
            setName={setName}
            date={date}
            setDate={setDate}
            loading={loading}
            handleSubmit={handleStoryGeneration}
            personalityType={personalityType}
            setPersonalityType={setPersonalityType}
            gender={gender}
            setGender={setGender}
            location={location}
            setLocation={setLocation}
            characterDescription={characterDescription}
            setCharacterDescription={setCharacterDescription}
            plotDescription={plotDescription}
            setPlotDescription={setPlotDescription}
          />
        )}

        {/* Show StoryResult only when explicitly requested and result exists */}
        {showStoryResult && result && (
          <StoryResult
            result={result}
            storyId={storyId}
            onRegenerateClick={handleStoryGeneration}
            onUndoClick={handleUndoWithHide}
            hasPreviousStory={false}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
