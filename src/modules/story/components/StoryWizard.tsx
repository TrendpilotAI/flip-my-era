import React, { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useStoryWizard, type WizardStep } from '../contexts/StoryWizardContext';
import { EraSelector } from './EraSelector';
import { StoryPromptsSelector } from './StoryPromptsSelector';
import { CharacterSelector } from './CharacterSelector';
import { StoryDetailsForm } from './StoryDetailsForm';
import { StorylinePreview } from './StorylinePreview';
import { StoryFormatSelector } from './StoryFormatSelector';
import { getPromptById } from '../data/storyPrompts';
import { getCharacterArchetypes } from '../types/eras';
import { generateStoryline } from '../services/storylineGeneration';
import { EbookGenerator } from '@/modules/ebook/components/EbookGenerator';
import { StoryAutoGeneration } from './StoryAutoGeneration';
import { AuthDialog } from '@/modules/shared/components/AuthDialog';
import { useClerkAuth } from '@/modules/auth/contexts';
import { sentryService } from '@/core/integrations/sentry';
import { posthogEvents } from '@/core/integrations/posthog';

export const StoryWizard: React.FC = () => {
  const { toast } = useToast();
  const { state, selectEra, selectPrompt, selectCustomPrompt, selectArchetype, setCharacterName, setGender, setLocation, setCustomPrompt, setStoryline, selectFormat, goToStep } = useStoryWizard();
  const { isAuthenticated, refreshUser, fetchCreditBalance, getToken } = useClerkAuth();
  
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);
  const [isRegeneratingStoryline, setIsRegeneratingStoryline] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pendingStep, setPendingStep] = useState<WizardStep | null>(null);
  const [pendingAction, setPendingAction] = useState<'generateStoryline' | null>(null);

  // Handle storyline generation
  const handleGenerateStoryline = async () => {
    if (!state.selectedEra || !state.selectedArchetype) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Require authentication before calling Edge Functions (Clerk token is required).
    // Runtime evidence showed isAuthenticated=false → getToken() returns null → "unauthorized".
    if (!isAuthenticated) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0345e24-6e67-4039-bc40-ee39fe5b7167',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'src/modules/story/components/StoryWizard.tsx:handleGenerateStoryline:blockedUnauth',message:'Blocked storyline generation; user not authenticated',data:{isAuthenticated:false,step:state.currentStep},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      setPendingAction('generateStoryline');
      // After sign-in, move forward to keep the flow intuitive
      setPendingStep('storyline-preview');
      setShowAuthPrompt(true);
      toast({
        title: "Please sign in",
        description: "Sign in to generate your storyline.",
      });
      return;
    }

    setIsGeneratingStoryline(true);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0345e24-6e67-4039-bc40-ee39fe5b7167',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'src/modules/story/components/StoryWizard.tsx:handleGenerateStoryline:preToken',message:'Storyline generate clicked',data:{isAuthenticated,hasEra:!!state.selectedEra,hasArchetype:!!state.selectedArchetype,era:state.selectedEra,step:state.currentStep},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      // Get the prompt description
      let promptDescription = '';
      if (state.isCustomPrompt) {
        promptDescription = state.customPrompt;
      } else if (state.selectedPromptId) {
        const prompt = getPromptById(state.selectedPromptId);
        promptDescription = prompt?.description || '';
      }

      // Get Clerk token for authentication
      const clerkToken = await getToken({ template: 'supabase' });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0345e24-6e67-4039-bc40-ee39fe5b7167',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'src/modules/story/components/StoryWizard.tsx:handleGenerateStoryline:postToken',message:'Clerk token fetched for storyline',data:{tokenPresent:!!clerkToken,tokenLength:clerkToken?clerkToken.length:0,template:'supabase'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      // Generate the storyline
      const storyline = await generateStoryline({
        era: state.selectedEra,
        characterName: state.characterName,
        characterArchetype: state.selectedArchetype.name,
        gender: state.gender,
        location: state.location,
        promptDescription,
        customPrompt: state.isCustomPrompt ? state.customPrompt : undefined
      }, clerkToken);

      setStoryline(storyline);

      sentryService.addBreadcrumb({
        category: 'wizard',
        message: 'Storyline generated successfully',
        level: 'info',
        data: { 
          era: state.selectedEra,
          chapterCount: storyline.chapters.length,
          wordCount: storyline.wordCountTotal,
        },
      });
      
      posthogEvents.storylineGenerationCompleted({
        era: state.selectedEra,
        chapterCount: storyline.chapters.length,
        wordCount: storyline.wordCountTotal,
        characterName: state.characterName,
        characterArchetype: state.selectedArchetype?.name,
      });

      toast({
        title: "Storyline Generated!",
        description: "Your story structure is ready to review.",
      });
    } catch (error) {
      posthogEvents.storylineGenerationFailed(
        error instanceof Error ? error.message : 'Unknown error',
        { era: state.selectedEra }
      );
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate storyline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStoryline(false);
    }
  };

  // Handle storyline regeneration
  const handleRegenerateStoryline = async () => {
    // Get Clerk token for authentication
    const clerkToken = await getToken();
    setIsRegeneratingStoryline(true);
    await handleGenerateStoryline();
    setIsRegeneratingStoryline(false);
  };

  // Handle format selection
  const handleFormatSelect = (format: typeof state.selectedFormat) => {
    selectFormat(format);
    sentryService.addBreadcrumb({
      category: 'wizard',
      message: 'Story format selected',
      level: 'info',
      data: { format, era: state.selectedEra },
    });
    posthogEvents.formatSelected(format || '', state.selectedEra || '');
  };

  const handleProtectedNavigation = (targetStep: WizardStep) => {
    if (!isAuthenticated) {
      setPendingStep(targetStep);
      setShowAuthPrompt(true);
      return;
    }
    goToStep(targetStep);
  };

  const handleAuthSuccess = useCallback(async () => {
    try {
      await refreshUser();
      await fetchCreditBalance();
    } catch (error) {
      // Post-auth sync failed - silently continue
    }

    // Resume pending action after successful auth
    if (pendingAction === 'generateStoryline') {
      setPendingAction(null);
      // Re-run now that auth should be present
      await handleGenerateStoryline();
      return;
    }

    if (pendingStep) {
      goToStep(pendingStep);
      setPendingStep(null);
    }
  }, [fetchCreditBalance, goToStep, pendingAction, pendingStep, refreshUser]);

  // Render the appropriate step
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'era-selection':
        return (
          <EraSelector
            onEraSelect={(era) => {
              selectEra(era);
              sentryService.addBreadcrumb({
                category: 'wizard',
                message: 'ERA selected',
                level: 'info',
                data: { era },
              });
              posthogEvents.eraSelected(era);
            }}
          />
        );

      case 'prompt-selection':
        return (
          <StoryPromptsSelector
            selectedEra={state.selectedEra!}
            onPromptSelect={(promptId) => {
              selectPrompt(promptId);
              sentryService.addBreadcrumb({
                category: 'wizard',
                message: 'Story prompt selected',
                level: 'info',
                data: { promptId, era: state.selectedEra },
              });
              posthogEvents.promptSelected(promptId, state.selectedEra || '', false);
            }}
            onBack={() => goToStep('era-selection')}
            onCreateOwn={() => {
              selectCustomPrompt();
              sentryService.addBreadcrumb({
                category: 'wizard',
                message: 'Custom prompt selected',
                level: 'info',
                data: { era: state.selectedEra },
              });
              posthogEvents.promptSelected('custom', state.selectedEra || '', true);
            }}
          />
        );

      case 'character-selection':
        return (
          <CharacterSelector
            selectedEra={state.selectedEra!}
            selectedArchetype={state.selectedArchetypeId}
            onArchetypeSelect={(archetypeId) => {
              const archetypes = getCharacterArchetypes(state.selectedEra!);
              const archetype = archetypes.find(a => a.id === archetypeId);
              if (archetype) {
                selectArchetype(archetypeId, archetype);
                sentryService.addBreadcrumb({
                  category: 'wizard',
                  message: 'Character archetype selected',
                  level: 'info',
                  data: { archetypeId, archetypeName: archetype.name, era: state.selectedEra },
                });
                posthogEvents.characterSelected(archetypeId, archetype.name, state.selectedEra || '');
              }
            }}
            onBack={() => goToStep('prompt-selection')}
            onContinue={() => {
              sentryService.addBreadcrumb({
                category: 'wizard',
                message: 'Navigated to story details',
                level: 'info',
                data: { era: state.selectedEra },
              });
              goToStep('story-details');
            }}
          />
        );

      case 'story-details':
        return (
          <StoryDetailsForm
            characterName={state.characterName}
            setCharacterName={setCharacterName}
            selectedArchetype={state.selectedArchetype}
            gender={state.gender}
            setGender={setGender}
            location={state.location}
            setLocation={setLocation}
            customPrompt={state.customPrompt}
            setCustomPrompt={setCustomPrompt}
            isCustomPrompt={state.isCustomPrompt}
            onBack={() => goToStep('character-selection')}
            onGenerate={handleGenerateStoryline}
            isGenerating={isGeneratingStoryline}
          />
        );

      case 'storyline-preview':
        if (!state.storyline) {
          goToStep('story-details');
          return null;
        }
        return (
          <StorylinePreview
            storyline={state.storyline}
            onBack={() => goToStep('story-details')}
            onRegenerate={handleRegenerateStoryline}
            onEdit={() => goToStep('story-details')}
            onContinue={() => handleProtectedNavigation('format-selection')}
            isRegenerating={isRegeneratingStoryline}
          />
        );

      case 'format-selection':
        return (
          <StoryFormatSelector
            selectedFormat={state.selectedFormat}
            onFormatSelect={handleFormatSelect}
            onBack={() => goToStep('storyline-preview')}
          />
        );

      case 'generation': {
        if (!state.storyline) {
          goToStep('story-details');
          return null;
        }
        // Pass storyline to EbookGenerator
        // For now, we'll show a placeholder story ID
        const placeholderStoryId = `story-${Date.now()}`;
        return (
          <EbookGenerator
            originalStory={state.storyline.logline}
            storyId={placeholderStoryId}
            storyline={state.storyline}
            storyFormat={state.selectedFormat || 'short-story'}
          />
        );
      }

      case 'auto-generation':
        if (!state.storyline) {
          goToStep('story-details');
          return null;
        }
        return <StoryAutoGeneration />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {renderCurrentStep()}
      </AnimatePresence>

      <AuthDialog
        trigger={null}
        open={showAuthPrompt}
        onOpenChange={(open) => {
          setShowAuthPrompt(open);
          if (!open && !isAuthenticated) {
            setPendingStep(null);
          }
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
