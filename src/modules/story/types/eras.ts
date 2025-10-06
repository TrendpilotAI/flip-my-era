/**
 * ERA Types and Configuration
 * Defines all Taylor Swift era types, their properties, and character archetypes
 */

export type EraType = 
  | 'showgirl'
  | 'folklore-evermore'
  | '1989'
  | 'red'
  | 'reputation'
  | 'lover'
  | 'midnights';

export interface CharacterArchetype {
  id: string;
  name: string;
  description: string;
  traits: string[];
}

export interface EraConfig {
  id: EraType;
  name: string;
  displayName: string;
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  characterArchetypes: CharacterArchetype[];
  imageUrl: string; // Will be populated from Runway generation
  promptPath: string; // Path to era-specific prompt file
  span: string; // CSS grid span class for Bento grid
}

// Character archetypes for each ERA
export const SHOWGIRL_ARCHETYPES: CharacterArchetype[] = [
  {
    id: 'showgirl-performer',
    name: 'The Showgirl/Performer',
    description: 'Dedicated to craft despite personal cost, finds identity in performance while seeking authentic self, resilient and glamorous',
    traits: ['Performance-driven', 'Resilient', 'Glamorous', 'Identity-seeking']
  },
  {
    id: 'showgirl-rescued-heart',
    name: 'The Rescued Heart',
    description: 'Someone saved from "drowning in melancholy" by unexpected love, learning to trust joy again',
    traits: ['Vulnerable', 'Hopeful', 'Grateful', 'Healing']
  },
  {
    id: 'showgirl-rising-star',
    name: 'The Rising Star',
    description: 'Navigating the glittering promises and dark realities of fame, warned but determined',
    traits: ['Ambitious', 'Cautious', 'Determined', 'Star-quality']
  },
  {
    id: 'showgirl-supportive-partner',
    name: 'The Supportive Partner',
    description: 'Understands the demands of spotlight, celebrates rather than competes with success, provides grounding',
    traits: ['Understanding', 'Supportive', 'Grounding', 'Celebrating']
  },
  {
    id: 'showgirl-industry-veteran',
    name: 'The Industry Veteran',
    description: 'Has survived the fickleness of fame, now choosing authenticity over perfection',
    traits: ['Experienced', 'Authentic', 'Wise', 'Selective']
  },
  {
    id: 'showgirl-exploited-protege',
    name: 'The Exploited Protégé',
    description: 'Realizing a mentor figure has strings attached to their support, must reclaim their narrative',
    traits: ['Awakening', 'Independent', 'Brave', 'Reclaiming']
  }
];

export const FOLKLORE_ARCHETYPES: CharacterArchetype[] = [
  {
    id: 'folklore-dreamer',
    name: 'The Dreamer',
    description: 'Introverted teen who finds solace in nature journaling and vintage photography',
    traits: ['Introspective', 'Creative', 'Nature-loving', 'Contemplative']
  },
  {
    id: 'folklore-wise-friend',
    name: 'The Wise Friend',
    description: 'That one person everyone turns to for advice, carries emotional weight of others',
    traits: ['Empathetic', 'Wise', 'Burdened', 'Trusted']
  },
  {
    id: 'folklore-lost-soul',
    name: 'The Lost Soul',
    description: 'Recently moved to a small town, seeking belonging and authentic connections',
    traits: ['Seeking', 'Open', 'Vulnerable', 'Adaptable']
  },
  {
    id: 'folklore-creative',
    name: 'The Creative',
    description: 'Writes poetry, plays acoustic guitar, sees magic in everyday moments',
    traits: ['Artistic', 'Perceptive', 'Magical', 'Expressive']
  },
  {
    id: 'folklore-healer',
    name: 'The Healer',
    description: 'Naturally empathetic, helps others through difficult times with gentle wisdom',
    traits: ['Empathetic', 'Gentle', 'Wise', 'Nurturing']
  }
];

export const ERA_1989_ARCHETYPES: CharacterArchetype[] = [
  {
    id: '1989-self-discoverer',
    name: 'The Self-Discoverer',
    description: 'Teen exploring their identity (sexuality, gender, interests) with supportive community',
    traits: ['Exploring', 'Brave', 'Authentic', 'Community-oriented']
  },
  {
    id: '1989-heart-healer',
    name: 'The Heart Healer',
    description: 'Someone learning to love themselves after experiencing rejection or trauma',
    traits: ['Healing', 'Self-loving', 'Resilient', 'Growing']
  },
  {
    id: '1989-bridge-builder',
    name: 'The Bridge Builder',
    description: 'Character who brings different communities together through love and understanding',
    traits: ['Connecting', 'Inclusive', 'Understanding', 'Unifying']
  },
  {
    id: '1989-celebration-planner',
    name: 'The Celebration Planner',
    description: 'Natural organizer who creates inclusive spaces for joy and connection',
    traits: ['Organizing', 'Joyful', 'Inclusive', 'Creative']
  },
  {
    id: '1989-gentle-rebel',
    name: 'The Gentle Rebel',
    description: 'Quietly revolutionary person who changes hearts through kindness and authenticity',
    traits: ['Revolutionary', 'Kind', 'Authentic', 'Impactful']
  }
];

export const RED_ARCHETYPES: CharacterArchetype[] = [
  {
    id: 'red-deep-feeler',
    name: 'The Deep Feeler',
    description: 'Teen who experiences emotions intensely and learns healthy processing',
    traits: ['Intense', 'Emotional', 'Processing', 'Deep']
  },
  {
    id: 'red-heartbreak-survivor',
    name: 'The Heartbreak Survivor',
    description: 'Someone navigating their first major loss (romantic, friendship, family)',
    traits: ['Surviving', 'Learning', 'Recovering', 'Growing']
  },
  {
    id: 'red-empath',
    name: 'The Empath',
    description: 'Character who absorbs others\' emotions and learns healthy boundaries',
    traits: ['Empathetic', 'Absorbing', 'Boundary-setting', 'Self-protecting']
  },
  {
    id: 'red-artist',
    name: 'The Artist',
    description: 'Creative soul who channels pain into beautiful expression and healing',
    traits: ['Creative', 'Expressive', 'Healing', 'Transformative']
  },
  {
    id: 'red-wisdom-seeker',
    name: 'The Wisdom Seeker',
    description: 'Teen who learns that growth comes through feeling, not avoiding pain',
    traits: ['Seeking', 'Growing', 'Feeling', 'Learning']
  }
];

export const REPUTATION_ARCHETYPES: CharacterArchetype[] = [
  {
    id: 'reputation-phoenix',
    name: 'The Phoenix',
    description: 'Teen who rises stronger after facing public humiliation or betrayal',
    traits: ['Rising', 'Strong', 'Transforming', 'Resilient']
  },
  {
    id: 'reputation-activist',
    name: 'The Activist',
    description: 'Passionate advocate who channels anger into meaningful change',
    traits: ['Passionate', 'Advocating', 'Changing', 'Purposeful']
  },
  {
    id: 'reputation-protector',
    name: 'The Protector',
    description: 'Fierce defender of friends and community who learns healthy boundaries',
    traits: ['Fierce', 'Defending', 'Loyal', 'Boundaried']
  },
  {
    id: 'reputation-truth-teller',
    name: 'The Truth-Teller',
    description: 'Unafraid to call out injustice even when it\'s uncomfortable',
    traits: ['Brave', 'Honest', 'Just', 'Unafraid']
  },
  {
    id: 'reputation-transformer',
    name: 'The Transformer',
    description: 'Someone who completely reinvents themselves on their own terms',
    traits: ['Reinventing', 'Independent', 'Self-defining', 'Bold']
  }
];

export const LOVER_ARCHETYPES: CharacterArchetype[] = ERA_1989_ARCHETYPES; // Same archetypes as 1989

export const MIDNIGHTS_ARCHETYPES: CharacterArchetype[] = [
  {
    id: 'midnights-late-night-thinker',
    name: 'The Late Night Thinker',
    description: 'Teen who processes everything at 3 AM, finding clarity in the quiet darkness',
    traits: ['Contemplative', 'Nocturnal', 'Introspective', 'Honest']
  },
  {
    id: 'midnights-anti-hero',
    name: 'The Anti-Hero',
    description: 'Someone learning to be their own best friend despite feeling like the problem',
    traits: ['Self-aware', 'Struggling', 'Honest', 'Growing']
  },
  {
    id: 'midnights-lavender-haze',
    name: 'The Dreamer in the Haze',
    description: 'Living in the present moment despite pressure to have everything figured out',
    traits: ['Present', 'Defiant', 'Dreamy', 'Authentic']
  },
  {
    id: 'midnights-midnight-rain',
    name: 'The Path Diverger',
    description: 'Choosing a different future than expected, honoring their own journey',
    traits: ['Independent', 'Choosing', 'Authentic', 'Brave']
  },
  {
    id: 'midnights-mastermind',
    name: 'The Mastermind',
    description: 'Perfectionist learning that chaos and vulnerability can be freeing',
    traits: ['Strategic', 'Controlling', 'Learning', 'Surrendering']
  }
];

// Main ERA configuration
export const ERA_CONFIG: Record<EraType, EraConfig> = {
  'showgirl': {
    id: 'showgirl',
    name: 'showgirl',
    displayName: 'The Life of a Showgirl',
    description: 'Glamorous performance, duality, joyful defiance',
    colorScheme: {
      primary: '#FF6B35', // Portofino orange
      secondary: '#7FB5B5', // Mint green/opalite
      gradient: 'from-orange-400 via-amber-300 to-teal-300'
    },
    characterArchetypes: SHOWGIRL_ARCHETYPES,
    imageUrl: '', // To be populated
    promptPath: '/Prompts/showgirl_era_prompt.md',
    span: 'col-span-2 row-span-2' // Larger card
  },
  'folklore-evermore': {
    id: 'folklore-evermore',
    name: 'folklore-evermore',
    displayName: 'Folklore/Evermore',
    description: 'Introspective, nature-based, melancholic',
    colorScheme: {
      primary: '#8B7355', // Earth brown
      secondary: '#D4A574', // Golden autumn
      gradient: 'from-amber-700 via-stone-600 to-amber-800'
    },
    characterArchetypes: FOLKLORE_ARCHETYPES,
    imageUrl: '',
    promptPath: '/Prompts/folklore_evermore_era_prompt.md',
    span: 'col-span-1 row-span-2'
  },
  '1989': {
    id: '1989',
    name: '1989',
    displayName: '1989',
    description: 'Urban, confident, independent',
    colorScheme: {
      primary: '#87CEEB', // Sky blue
      secondary: '#FFB6C1', // Light pink
      gradient: 'from-sky-400 via-blue-300 to-pink-300'
    },
    characterArchetypes: ERA_1989_ARCHETYPES,
    imageUrl: '',
    promptPath: '/Prompts/1989_era_prompt.md',
    span: 'col-span-2 row-span-1'
  },
  'red': {
    id: 'red',
    name: 'red',
    displayName: 'Red',
    description: 'Emotionally intense, passionate, transformative',
    colorScheme: {
      primary: '#8B0000', // Dark red
      secondary: '#CD853F', // Burnt orange
      gradient: 'from-red-800 via-rose-600 to-amber-700'
    },
    characterArchetypes: RED_ARCHETYPES,
    imageUrl: '',
    promptPath: '/Prompts/red_era_prompt.md',
    span: 'col-span-1 row-span-1'
  },
  'reputation': {
    id: 'reputation',
    name: 'reputation',
    displayName: 'Reputation',
    description: 'Empowering, resilient, justice-seeking',
    colorScheme: {
      primary: '#000000', // Black
      secondary: '#4A4A4A', // Dark gray
      gradient: 'from-black via-gray-800 to-gray-900'
    },
    characterArchetypes: REPUTATION_ARCHETYPES,
    imageUrl: '',
    promptPath: '/Prompts/reputation_era_prompt.md',
    span: 'col-span-1 row-span-1'
  },
  'lover': {
    id: 'lover',
    name: 'lover',
    displayName: 'Lover',
    description: 'Celebratory, inclusive, self-accepting',
    colorScheme: {
      primary: '#FFB6C1', // Pink
      secondary: '#87CEEB', // Sky blue
      gradient: 'from-pink-400 via-purple-300 to-blue-400'
    },
    characterArchetypes: LOVER_ARCHETYPES,
    imageUrl: '',
    promptPath: '/Prompts/lover_era_prompt.md',
    span: 'col-span-2 row-span-1'
  },
  'midnights': {
    id: 'midnights',
    name: 'midnights',
    displayName: 'Midnights',
    description: 'Late-night confessions, vulnerability, modern anxiety',
    colorScheme: {
      primary: '#191970', // Midnight blue
      secondary: '#E6E6FA', // Lavender
      gradient: 'from-indigo-900 via-purple-800 to-blue-900'
    },
    characterArchetypes: MIDNIGHTS_ARCHETYPES,
    imageUrl: '',
    promptPath: '/Prompts/midnights_era_prompt.md',
    span: 'col-span-1 row-span-2'
  }
};

// Helper functions
export function getEraConfig(eraType: EraType): EraConfig {
  return ERA_CONFIG[eraType];
}

export function getCharacterArchetypes(eraType: EraType): CharacterArchetype[] {
  return ERA_CONFIG[eraType].characterArchetypes;
}

export function getAllEras(): EraConfig[] {
  return Object.values(ERA_CONFIG);
}
