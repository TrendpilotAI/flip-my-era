import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { useThemeColors } from '@/modules/shared/utils/themeUtils';
import { AuthDialog } from '@/modules/shared/components/AuthDialog';
import { StoryForm } from '@/modules/story/components/StoryForm';
import { StoryResult } from '@/modules/story/components/StoryResult';
import { PageHeader } from '@/modules/story/components/PageHeader';
import { BackgroundImages } from '@/modules/story/components/BackgroundImages';
import { SparkleEffect } from '@/modules/story/components/SparkleEffect';
import { useStoryGeneration } from '@/modules/story/hooks/useStoryGeneration';
import { BookOpen, User, Star, Sparkles } from 'lucide-react';
import { personalityTypes } from '@/modules/story/types/personality';

const Index = () => {
  const { isAuthenticated } = useClerkAuth();
  const { currentTheme } = useTheme();
  const themeColors = useThemeColors();
  const {
    name,
    setName,
    date,
    setDate,
    loading,
    result,
    personalityType,
    setPersonalityType,
    gender,
    setGender,
    storyId,
    previousStory,
    location,
    setLocation,
    handleStorySelect,
    handleSubmit,
    handleUndo
  } = useStoryGeneration();

  return (
    <div 
      className="min-h-screen py-12 px-4 relative overflow-hidden"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <PageHeader />

        {/* Call-to-action for non-authenticated users */}
        {!isAuthenticated && (
          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
                <Sparkles className="h-6 w-6" style={{ color: themeColors.primary }} />
                Unlock Your Full Potential
                <Sparkles className="h-6 w-6" style={{ color: themeColors.primary }} />
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Sign up to save your stories, access your personal dashboard, and unlock premium features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="h-4 w-4" style={{ color: themeColors.primary }} />
                  <span>Save & organize stories</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <User className="h-4 w-4 text-gray-500" />
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
                    <Button 
                      className="text-white"
                      style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Started - It's Free!
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

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
          gender={gender}
          setGender={setGender}
          location={location}
          setLocation={setLocation}
        />

        {result && (
          <StoryResult
            result={result}
            storyId={storyId}
            onRegenerateClick={handleSubmit}
            onUndoClick={handleUndo}
            hasPreviousStory={!!previousStory}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
