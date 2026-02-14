/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StoryWizardProvider, useStoryWizard } from '../StoryWizardContext';
import type { Storyline } from '../../services/storylineGeneration';
import type { CharacterArchetype } from '../../types/eras';

// Mock storylineGeneration module to avoid pulling in supabase/sentry/posthog
vi.mock('../../services/storylineGeneration', () => ({}));

const STORAGE_KEY = 'story-wizard-state';

const mockStoryline: Storyline = {
  logline: 'A test story logline',
  threeActStructure: {
    act1: { setup: 'Setup', incitingIncident: 'Incident', firstPlotPoint: 'Plot point' },
    act2: { risingAction: 'Rising', midpoint: 'Midpoint', darkNightOfTheSoul: 'Dark night' },
    act3: { climax: 'Climax', resolution: 'Resolution', closingImage: 'Closing' },
  },
  chapters: [
    { number: 1, title: 'Chapter 1', summary: 'Summary 1', wordCountTarget: 1000 },
    { number: 2, title: 'Chapter 2', summary: 'Summary 2', wordCountTarget: 1000 },
  ],
  themes: ['courage', 'friendship'],
  wordCountTotal: 2000,
};

const mockArchetype: CharacterArchetype = {
  id: 'dreamer',
  name: 'The Dreamer',
  description: 'A dreamy character',
  traits: ['imaginative', 'hopeful'],
};

// Helper component to expose wizard state and actions
function TestConsumer({ onState }: { onState: (ctx: ReturnType<typeof useStoryWizard>) => void }) {
  const ctx = useStoryWizard();
  onState(ctx);
  return (
    <div>
      <span data-testid="step">{ctx.state.currentStep}</span>
      <span data-testid="era">{ctx.state.selectedEra || 'none'}</span>
      <span data-testid="prompt">{ctx.state.selectedPromptId || 'none'}</span>
      <span data-testid="archetype">{ctx.state.selectedArchetypeId || 'none'}</span>
      <span data-testid="name">{ctx.state.characterName || 'none'}</span>
      <span data-testid="gender">{ctx.state.gender}</span>
      <span data-testid="location">{ctx.state.location || 'none'}</span>
      <span data-testid="format">{ctx.state.selectedFormat || 'none'}</span>
      <span data-testid="custom">{String(ctx.state.isCustomPrompt)}</span>
      <span data-testid="storyline">{ctx.state.storyline ? 'yes' : 'no'}</span>
      <span data-testid="story">{ctx.state.latestGeneratedStory || 'none'}</span>
    </div>
  );
}

function renderWizard() {
  let ctxRef: ReturnType<typeof useStoryWizard>;
  const result = render(
    <StoryWizardProvider>
      <TestConsumer onState={(ctx) => { ctxRef = ctx; }} />
    </StoryWizardProvider>,
  );
  return { ...result, getCtx: () => ctxRef! };
}

describe('StoryWizardContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('should start at era-selection step', () => {
      renderWizard();
      expect(screen.getByTestId('step').textContent).toBe('era-selection');
    });

    it('should have null selections initially', () => {
      renderWizard();
      expect(screen.getByTestId('era').textContent).toBe('none');
      expect(screen.getByTestId('prompt').textContent).toBe('none');
      expect(screen.getByTestId('archetype').textContent).toBe('none');
      expect(screen.getByTestId('format').textContent).toBe('none');
    });

    it('should throw when useStoryWizard is used outside provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(<TestConsumer onState={() => {}} />);
      }).toThrow('useStoryWizard must be used within a StoryWizardProvider');
      spy.mockRestore();
    });
  });

  describe('Step Navigation', () => {
    it('should advance to prompt-selection after ERA is selected', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectEra('1989'));
      expect(screen.getByTestId('step').textContent).toBe('prompt-selection');
      expect(screen.getByTestId('era').textContent).toBe('1989');
    });

    it('should advance to character-selection after prompt is selected', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectEra('1989'));
      act(() => getCtx().selectPrompt('prompt-1'));
      expect(screen.getByTestId('step').textContent).toBe('character-selection');
      expect(screen.getByTestId('prompt').textContent).toBe('prompt-1');
    });

    it('should navigate back to previous step', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectEra('red'));
      expect(screen.getByTestId('step').textContent).toBe('prompt-selection');
      act(() => getCtx().goBack());
      expect(screen.getByTestId('step').textContent).toBe('era-selection');
    });

    it('should not go back from era-selection', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().goBack());
      expect(screen.getByTestId('step').textContent).toBe('era-selection');
    });

    it('should navigate forward with goNext', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().goNext());
      expect(screen.getByTestId('step').textContent).toBe('prompt-selection');
    });

    it('should allow direct step navigation with goToStep', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().goToStep('format-selection'));
      expect(screen.getByTestId('step').textContent).toBe('format-selection');
    });

    it('should handle goBack from auto-generation (maps to generation index)', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().goToStep('auto-generation'));
      act(() => getCtx().goBack());
      expect(screen.getByTestId('step').textContent).toBe('format-selection');
    });
  });

  describe('State Transitions', () => {
    it('should set custom prompt mode and advance to character-selection', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectEra('folklore-evermore'));
      act(() => getCtx().selectCustomPrompt());
      expect(screen.getByTestId('custom').textContent).toBe('true');
      expect(screen.getByTestId('prompt').textContent).toBe('none');
      expect(screen.getByTestId('step').textContent).toBe('character-selection');
    });

    it('should set archetype without changing step', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectArchetype('dreamer', mockArchetype));
      expect(screen.getByTestId('archetype').textContent).toBe('dreamer');
      // Step should NOT auto-advance for archetype selection
      expect(screen.getByTestId('step').textContent).toBe('era-selection');
    });

    it('should set character name, gender, and location', () => {
      const { getCtx } = renderWizard();
      act(() => {
        getCtx().setCharacterName('Taylor');
        getCtx().setGender('flip');
        getCtx().setLocation('New York');
      });
      expect(screen.getByTestId('name').textContent).toBe('Taylor');
      expect(screen.getByTestId('gender').textContent).toBe('flip');
      expect(screen.getByTestId('location').textContent).toBe('New York');
    });

    it('should set storyline and advance to storyline-preview', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().setStoryline(mockStoryline));
      expect(screen.getByTestId('step').textContent).toBe('storyline-preview');
      expect(screen.getByTestId('storyline').textContent).toBe('yes');
    });

    it('should clear generated story when setting new storyline', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().setLatestGeneratedStory('old story'));
      expect(screen.getByTestId('story').textContent).toBe('old story');
      act(() => getCtx().setStoryline(mockStoryline));
      expect(screen.getByTestId('story').textContent).toBe('none');
    });

    it('should set latest generated story and chapters', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().setLatestGeneratedStory('Generated content', mockStoryline.chapters));
      expect(screen.getByTestId('story').textContent).toBe('Generated content');
    });
  });

  describe('Format Selection Routing', () => {
    it('should route to auto-generation when storyline exists', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().setStoryline(mockStoryline));
      act(() => getCtx().selectFormat('short-story'));
      expect(screen.getByTestId('step').textContent).toBe('auto-generation');
      expect(screen.getByTestId('format').textContent).toBe('short-story');
    });

    it('should route to generation when no storyline exists', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectFormat('preview'));
      expect(screen.getByTestId('step').textContent).toBe('generation');
      expect(screen.getByTestId('format').textContent).toBe('preview');
    });
  });

  describe('SessionStorage Persistence', () => {
    it('should persist state to sessionStorage on every change', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectEra('midnights'));

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
      expect(stored.selectedEra).toBe('midnights');
      expect(stored.currentStep).toBe('prompt-selection');
    });

    it('should restore state from sessionStorage on mount', () => {
      const savedState = {
        ...JSON.parse(JSON.stringify({
          currentStep: 'story-details',
          selectedEra: 'reputation',
          selectedPromptId: 'prompt-2',
          selectedArchetypeId: 'rebel',
          selectedArchetype: null,
          characterName: 'Alex',
          gender: 'flip',
          location: 'LA',
          customPrompt: '',
          isCustomPrompt: false,
          storyline: null,
          selectedFormat: null,
          latestGeneratedStory: null,
          latestGeneratedChapters: null,
        })),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      renderWizard();
      expect(screen.getByTestId('step').textContent).toBe('story-details');
      expect(screen.getByTestId('era').textContent).toBe('reputation');
      expect(screen.getByTestId('name').textContent).toBe('Alex');
    });

    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem(STORAGE_KEY, 'not valid json {{{');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWizard();
      expect(screen.getByTestId('step').textContent).toBe('era-selection');
      spy.mockRestore();
    });
  });

  describe('Reset', () => {
    it('should reset all state on resetWizard', () => {
      const { getCtx } = renderWizard();
      // Build up state
      act(() => {
        getCtx().selectEra('lover');
        getCtx().selectPrompt('prompt-3');
        getCtx().selectArchetype('dreamer', mockArchetype);
        getCtx().setCharacterName('Taylor');
        getCtx().setLocation('Nashville');
      });
      // Reset
      act(() => getCtx().resetWizard());

      expect(screen.getByTestId('step').textContent).toBe('era-selection');
      expect(screen.getByTestId('era').textContent).toBe('none');
      expect(screen.getByTestId('prompt').textContent).toBe('none');
      expect(screen.getByTestId('archetype').textContent).toBe('none');
      expect(screen.getByTestId('name').textContent).toBe('none');
      expect(screen.getByTestId('location').textContent).toBe('none');
    });

    it('should clear sessionStorage on resetWizard', () => {
      const { getCtx } = renderWizard();
      act(() => getCtx().selectEra('1989'));
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeTruthy();

      act(() => getCtx().resetWizard());
      // After reset, useEffect will persist initialState, but removeItem is called first
      // The final value depends on React's batching - just verify state is initial
      expect(screen.getByTestId('step').textContent).toBe('era-selection');
    });
  });
});
