import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type EraType, type CharacterArchetype } from '../types/eras';
import { type Storyline } from '../services/storylineGeneration';

export type WizardStep = 
  | 'era-selection'
  | 'prompt-selection'
  | 'character-selection'
  | 'story-details'
  | 'storyline-preview'
  | 'format-selection'
  | 'generation';

export type StoryFormat = 'preview' | 'short-story' | 'novella';

export type GenderType = 'same' | 'flip' | 'neutral';

interface StoryWizardState {
  currentStep: WizardStep;
  selectedEra: EraType | null;
  selectedPromptId: string | null;
  selectedArchetypeId: string | null;
  selectedArchetype: CharacterArchetype | null;
  characterName: string;
  gender: GenderType;
  location: string;
  customPrompt: string;
  isCustomPrompt: boolean;
  storyline: Storyline | null;
  selectedFormat: StoryFormat | null;
}

interface StoryWizardContextType {
  state: StoryWizardState;
  // Navigation
  setCurrentStep: (step: WizardStep) => void;
  goToStep: (step: WizardStep) => void;
  goBack: () => void;
  goNext: () => void;
  // ERA selection
  selectEra: (era: EraType) => void;
  // Prompt selection
  selectPrompt: (promptId: string) => void;
  selectCustomPrompt: () => void;
  // Character selection
  selectArchetype: (archetypeId: string, archetype: CharacterArchetype) => void;
  // Story details
  setCharacterName: (name: string) => void;
  setGender: (gender: GenderType) => void;
  setLocation: (location: string) => void;
  setCustomPrompt: (prompt: string) => void;
  // Storyline
  setStoryline: (storyline: Storyline) => void;
  // Format selection
  selectFormat: (format: StoryFormat) => void;
  // Reset
  resetWizard: () => void;
}

const STORAGE_KEY = 'story-wizard-state';

const initialState: StoryWizardState = {
  currentStep: 'era-selection',
  selectedEra: null,
  selectedPromptId: null,
  selectedArchetypeId: null,
  selectedArchetype: null,
  characterName: '',
  gender: 'same',
  location: '',
  customPrompt: '',
  isCustomPrompt: false,
  storyline: null,
  selectedFormat: null,
};

const StoryWizardContext = createContext<StoryWizardContextType | undefined>(undefined);

export const useStoryWizard = () => {
  const context = useContext(StoryWizardContext);
  if (!context) {
    throw new Error('useStoryWizard must be used within a StoryWizardProvider');
  }
  return context;
};

interface StoryWizardProviderProps {
  children: ReactNode;
}

export const StoryWizardProvider: React.FC<StoryWizardProviderProps> = ({ children }) => {
  const [state, setState] = useState<StoryWizardState>(() => {
    // Try to load state from sessionStorage
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading wizard state from storage:', error);
    }
    return initialState;
  });

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving wizard state to storage:', error);
    }
  }, [state]);

  // Navigation functions
  const setCurrentStep = (step: WizardStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goBack = () => {
    const steps: WizardStep[] = [
      'era-selection',
      'prompt-selection',
      'character-selection',
      'story-details',
      'storyline-preview',
      'format-selection',
      'generation'
    ];
    const currentIndex = steps.indexOf(state.currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const goNext = () => {
    const steps: WizardStep[] = [
      'era-selection',
      'prompt-selection',
      'character-selection',
      'story-details',
      'storyline-preview',
      'format-selection',
      'generation'
    ];
    const currentIndex = steps.indexOf(state.currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // ERA selection
  const selectEra = (era: EraType) => {
    setState(prev => ({
      ...prev,
      selectedEra: era,
      currentStep: 'prompt-selection'
    }));
  };

  // Prompt selection
  const selectPrompt = (promptId: string) => {
    setState(prev => ({
      ...prev,
      selectedPromptId: promptId,
      isCustomPrompt: false,
      currentStep: 'character-selection'
    }));
  };

  const selectCustomPrompt = () => {
    setState(prev => ({
      ...prev,
      selectedPromptId: null,
      isCustomPrompt: true,
      currentStep: 'character-selection'
    }));
  };

  // Character selection
  const selectArchetype = (archetypeId: string, archetype: CharacterArchetype) => {
    setState(prev => ({
      ...prev,
      selectedArchetypeId: archetypeId,
      selectedArchetype: archetype
    }));
  };

  // Story details
  const setCharacterName = (name: string) => {
    setState(prev => ({ ...prev, characterName: name }));
  };

  const setGender = (gender: GenderType) => {
    setState(prev => ({ ...prev, gender }));
  };

  const setLocation = (location: string) => {
    setState(prev => ({ ...prev, location }));
  };

  const setCustomPrompt = (prompt: string) => {
    setState(prev => ({ ...prev, customPrompt: prompt }));
  };

  // Storyline
  const setStoryline = (storyline: Storyline) => {
    setState(prev => ({
      ...prev,
      storyline,
      currentStep: 'storyline-preview'
    }));
  };

  // Format selection
  const selectFormat = (format: StoryFormat) => {
    setState(prev => ({
      ...prev,
      selectedFormat: format,
      currentStep: 'generation'
    }));
  };

  // Reset wizard
  const resetWizard = () => {
    setState(initialState);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing wizard state from storage:', error);
    }
  };

  const contextValue: StoryWizardContextType = {
    state,
    setCurrentStep,
    goToStep,
    goBack,
    goNext,
    selectEra,
    selectPrompt,
    selectCustomPrompt,
    selectArchetype,
    setCharacterName,
    setGender,
    setLocation,
    setCustomPrompt,
    setStoryline,
    selectFormat,
    resetWizard,
  };

  return (
    <StoryWizardContext.Provider value={contextValue}>
      {children}
    </StoryWizardContext.Provider>
  );
};
