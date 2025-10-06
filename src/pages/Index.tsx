import { useRef } from 'react';
import { useApiCheck } from '@/modules/shared/hooks/useApiCheck';
import { useClerkAuth } from '@/modules/auth/contexts';
import { Button } from "@/modules/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { HeroGallery } from "@/modules/shared/components/HeroGallery";
import { StoryWizard } from "@/modules/story/components/StoryWizard";
import { StoryWizardProvider } from "@/modules/story/contexts/StoryWizardContext";
import { BookOpen, Sparkles, User, Star } from "lucide-react";

const Index = () => {
  useApiCheck();
  const { isAuthenticated } = useClerkAuth();
  const wizardRef = useRef<HTMLDivElement>(null);

  const scrollToWizard = () => {
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Hero Section with Photo Gallery */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-900/50 pointer-events-none" />
        <HeroGallery animationDelay={0.3} onGetStarted={scrollToWizard} />
      </div>

      {/* Call-to-action for non-authenticated users */}
      {!isAuthenticated && (
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <Card className="bg-white/90 backdrop-blur-lg border border-purple-100 dark:border-purple-900 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Unlock Your Full Potential
                <Sparkles className="h-6 w-6 text-purple-500" />
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
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
        </div>
      )}

      {/* Story Wizard Section */}
      <div ref={wizardRef} className="scroll-mt-8">
        <StoryWizardProvider>
          <StoryWizard />
        </StoryWizardProvider>
      </div>
    </div>
  );
};

export default Index;
