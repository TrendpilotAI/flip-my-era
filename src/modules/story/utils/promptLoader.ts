/**
 * Prompt Loader Utility
 * Loads and caches system prompts from markdown files
 */

import { EraType } from '../types/eras';

// Import prompts as raw strings - These will be configured in vite.config.ts
import masterPrompt from '/Prompts/FlipMyEra Master System Prompt.md?raw';
import showgirlPrompt from '/Prompts/showgirl_era_prompt.md?raw';
import folklorePrompt from '/Prompts/folklore_evermore_era_prompt.md?raw';
import era1989Prompt from '/Prompts/1989_era_prompt.md?raw';
import loverPrompt from '/Prompts/lover_era_prompt.md?raw';
import redPrompt from '/Prompts/red_era_prompt.md?raw';
import reputationPrompt from '/Prompts/reputation_era_prompt.md?raw';
import midnightsPrompt from '/Prompts/midnights_era_prompt.md?raw';

// ERA prompt mappings
const ERA_PROMPTS: Record<EraType, string> = {
  'showgirl': showgirlPrompt,
  'folklore-evermore': folklorePrompt,
  '1989': era1989Prompt,
  'red': redPrompt,
  'reputation': reputationPrompt,
  'lover': loverPrompt,
  'midnights': midnightsPrompt
};

/**
 * Get the Master System Prompt
 * This is the core FlipMyEra Story Architect prompt
 */
export function loadMasterSystemPrompt(): string {
  return masterPrompt;
}

/**
 * Get the ERA-specific prompt
 * @param era - The ERA type to load the prompt for
 * @returns The ERA-specific prompt content
 */
export function loadEraPrompt(era: EraType): string {
  return ERA_PROMPTS[era] || '';
}

/**
 * Get combined system prompt (Master + ERA-specific)
 * @param era - The ERA type
 * @returns Combined prompt string
 */
export function getCombinedSystemPrompt(era: EraType): string {
  const masterSystemPrompt = loadMasterSystemPrompt();
  const eraPrompt = loadEraPrompt(era);
  
  return `${masterSystemPrompt}

---

## ERA-SPECIFIC GUIDANCE

${eraPrompt}

---

When creating storylines and narratives, follow the Master System Prompt framework while incorporating the specific themes, aesthetics, and character archetypes from the selected ERA above.`;
}

/**
 * Extract specific sections from prompts for use in storyline generation
 */
export function extractPromptSections(prompt: string): {
  themes: string[];
  settings: string[];
  toneGuidelines: string[];
} {
  const themes: string[] = [];
  const settings: string[] = [];
  const toneGuidelines: string[] = [];

  // Extract themes (look for bullet points under theme sections)
  const themeMatches = prompt.match(/##\s+(?:Core\s+)?(?:Aesthetic|Themes)[^\n]*\n((?:[-*]\s+[^\n]+\n?)+)/gi);
  if (themeMatches) {
    themeMatches.forEach(match => {
      const items = match.match(/[-*]\s+([^\n]+)/g);
      if (items) {
        themes.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    });
  }

  // Extract settings
  const settingMatches = prompt.match(/##\s+Setting\s+Elements[^\n]*\n((?:[-*]\s+[^\n]+\n?)+)/gi);
  if (settingMatches) {
    settingMatches.forEach(match => {
      const items = match.match(/[-*]\s+([^\n]+)/g);
      if (items) {
        settings.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    });
  }

  // Extract tone guidelines
  const toneMatches = prompt.match(/##\s+(?:Tone|Voice|Language)[^\n]*\n((?:[-*]\s+[^\n]+\n?)+)/gi);
  if (toneMatches) {
    toneMatches.forEach(match => {
      const items = match.match(/[-*]\s+([^\n]+)/g);
      if (items) {
        toneGuidelines.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    });
  }

  return {
    themes: [...new Set(themes)], // Remove duplicates
    settings: [...new Set(settings)],
    toneGuidelines: [...new Set(toneGuidelines)]
  };
}
