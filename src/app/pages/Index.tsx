import { useRef } from 'react';
import { useApiCheck } from '@/modules/shared/hooks/useApiCheck';
import { useClerkAuth } from '@/modules/auth/contexts';
import { Button } from "@/modules/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { HeroGallery } from "@/modules/shared/components/HeroGallery";
import { StoryWizard } from "@/modules/story/components/StoryWizard";
import { StoryWizardProvider } from "@/modules/story/contexts/StoryWizardContext";
import { AnimatedShaderBackground } from "@/modules/shared/components/AnimatedShaderBackground";
import { BookOpen, Sparkles, User, Star } from "lucide-react";

const Index = () => {
  useApiCheck();
  const { isAuthenticated } = useClerkAuth();
  const wizardRef = useRef<HTMLDivElement>(null);

  const scrollToWizard = () => {
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-blue-50/80 dark:from-gray-900/90 dark:via-purple-950/90 dark:to-gray-900/90">
      {/* Animated Shader Background - spans entire page */}
      <AnimatedShaderBackground className="z-0" />
      
      {/* Content wrapper with higher z-index */}
      <div className="relative z-10">
        {/* Hero Section with Photo Gallery */}
      <HeroGallery animationDelay={0.3} onGetStarted={scrollToWizard} />

      {/* Story Wizard Section */}
      <div ref={wizardRef} className="scroll-mt-8">
          <StoryWizardProvider>
            <StoryWizard />
          </StoryWizardProvider>
        </div>
      </div>
    </div>
  );
};

export default Index;
