/**
 * Artist Template System
 * Multi-artist era templates — extensible beyond Taylor Swift
 */

import { ERA_CONFIG, type EraConfig, type EraType, type CharacterArchetype } from '../story/types/eras';

// ── Types ──────────────────────────────────────────────

export interface ArtistEra {
  id: string;
  name: string;
  displayName: string;
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  characterArchetypes: CharacterArchetype[];
  imageUrl: string;
}

export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface ArtistTemplate {
  artistId: string;
  name: string;
  imageUrl: string;
  description: string;
  eras: ArtistEra[];
  themes: string[];
  colorPalettes: ColorPalette[];
}

// ── Helpers ────────────────────────────────────────────

/** Convert existing Taylor Swift EraConfig → ArtistEra */
function tsEraToArtistEra(cfg: EraConfig): ArtistEra {
  return {
    id: cfg.id,
    name: cfg.name,
    displayName: cfg.displayName,
    description: cfg.description,
    colorScheme: cfg.colorScheme,
    characterArchetypes: cfg.characterArchetypes,
    imageUrl: cfg.imageUrl,
  };
}

// ── Seed Templates ─────────────────────────────────────

export const TAYLOR_SWIFT_TEMPLATE: ArtistTemplate = {
  artistId: 'taylor-swift',
  name: 'Taylor Swift',
  imageUrl: '',
  description: 'From country to pop to indie folk — every era tells a story',
  eras: Object.values(ERA_CONFIG).map(tsEraToArtistEra),
  themes: ['Coming of age', 'Heartbreak', 'Self-discovery', 'Fame', 'Resilience', 'Love'],
  colorPalettes: [
    { name: 'Reputation Dark', colors: ['#000000', '#4A4A4A', '#1a1a2e'] },
    { name: 'Lover Pastel', colors: ['#FFB6C1', '#87CEEB', '#E6E6FA'] },
    { name: 'Folklore Earth', colors: ['#8B7355', '#D4A574', '#6B5B4F'] },
  ],
};

export const BEYONCE_TEMPLATE: ArtistTemplate = {
  artistId: 'beyonce',
  name: 'Beyoncé',
  imageUrl: '',
  description: 'Queen Bey — from Destiny\'s Child to country renaissance',
  eras: [
    {
      id: 'renaissance',
      name: 'renaissance',
      displayName: 'Renaissance',
      description: 'Dance, liberation, queer ballroom culture, disco revival',
      colorScheme: { primary: '#C0C0C0', secondary: '#FFD700', gradient: 'from-yellow-400 via-amber-300 to-gray-300' },
      characterArchetypes: [
        { id: 'ren-diva', name: 'The Diva Reborn', description: 'Reclaiming joy through dance and self-expression', traits: ['Liberated', 'Joyful', 'Confident', 'Expressive'] },
        { id: 'ren-muse', name: 'The Muse', description: 'Inspiring others to break free from expectations', traits: ['Inspiring', 'Free', 'Creative', 'Bold'] },
      ],
      imageUrl: '',
    },
    {
      id: 'lemonade',
      name: 'lemonade',
      displayName: 'Lemonade',
      description: 'Betrayal, Black womanhood, resilience, forgiveness',
      colorScheme: { primary: '#FFD700', secondary: '#8B4513', gradient: 'from-yellow-500 via-amber-600 to-yellow-700' },
      characterArchetypes: [
        { id: 'lem-survivor', name: 'The Survivor', description: 'Turning pain into power, refusing to be broken', traits: ['Resilient', 'Fierce', 'Healing', 'Powerful'] },
        { id: 'lem-truth', name: 'The Truth Speaker', description: 'Confronting betrayal with grace and fury', traits: ['Honest', 'Furious', 'Graceful', 'Unbreakable'] },
      ],
      imageUrl: '',
    },
    {
      id: 'bday',
      name: 'bday',
      displayName: 'B\'Day',
      description: 'Fierce independence, celebration, Sasha Fierce energy',
      colorScheme: { primary: '#FF1493', secondary: '#FFD700', gradient: 'from-pink-500 via-rose-400 to-yellow-400' },
      characterArchetypes: [
        { id: 'bday-fierce', name: 'The Fierce One', description: 'Unapologetically bold and independent', traits: ['Bold', 'Independent', 'Fierce', 'Celebratory'] },
        { id: 'bday-dreamer', name: 'The Dreamer', description: 'Manifesting a bigger future against all odds', traits: ['Ambitious', 'Dreaming', 'Determined', 'Unstoppable'] },
      ],
      imageUrl: '',
    },
    {
      id: 'cowboy-carter',
      name: 'cowboy-carter',
      displayName: 'Cowboy Carter',
      description: 'Country roots, reclaiming space, genre-bending',
      colorScheme: { primary: '#8B4513', secondary: '#F5DEB3', gradient: 'from-amber-800 via-yellow-700 to-stone-400' },
      characterArchetypes: [
        { id: 'cc-trailblazer', name: 'The Trailblazer', description: 'Breaking into spaces where you were told you don\'t belong', traits: ['Pioneering', 'Brave', 'Authentic', 'Defiant'] },
        { id: 'cc-storyteller', name: 'The Storyteller', description: 'Weaving family history into new narratives', traits: ['Rooted', 'Creative', 'Proud', 'Narrative'] },
      ],
      imageUrl: '',
    },
  ],
  themes: ['Black excellence', 'Empowerment', 'Love & betrayal', 'Cultural reclamation', 'Independence'],
  colorPalettes: [
    { name: 'Lemonade Gold', colors: ['#FFD700', '#8B4513', '#FFA500'] },
    { name: 'Renaissance Silver', colors: ['#C0C0C0', '#FFD700', '#E8E8E8'] },
    { name: 'Cowboy Earth', colors: ['#8B4513', '#F5DEB3', '#D2691E'] },
  ],
};

export const HARRY_STYLES_TEMPLATE: ArtistTemplate = {
  artistId: 'harry-styles',
  name: 'Harry Styles',
  imageUrl: '',
  description: 'From boy band to boundary-breaking solo artist',
  eras: [
    {
      id: 'fine-line',
      name: 'fine-line',
      displayName: 'Fine Line',
      description: 'Vulnerability, sexuality, psychedelic freedom',
      colorScheme: { primary: '#FF69B4', secondary: '#98FB98', gradient: 'from-pink-400 via-green-300 to-yellow-200' },
      characterArchetypes: [
        { id: 'fl-free-spirit', name: 'The Free Spirit', description: 'Living authentically, embracing all parts of yourself', traits: ['Authentic', 'Free', 'Vulnerable', 'Joyful'] },
        { id: 'fl-lover', name: 'The Gentle Lover', description: 'Navigating love with tenderness and honesty', traits: ['Tender', 'Honest', 'Open', 'Romantic'] },
      ],
      imageUrl: '',
    },
    {
      id: 'harrys-house',
      name: 'harrys-house',
      displayName: 'Harry\'s House',
      description: 'Domesticity, intimacy, finding home in a person',
      colorScheme: { primary: '#FFE4B5', secondary: '#87CEEB', gradient: 'from-yellow-200 via-orange-100 to-blue-200' },
      characterArchetypes: [
        { id: 'hh-homebody', name: 'The Homebody', description: 'Finding peace in small moments and quiet love', traits: ['Peaceful', 'Present', 'Intimate', 'Grounded'] },
        { id: 'hh-nostalgic', name: 'The Nostalgic', description: 'Looking back fondly while building something new', traits: ['Reflective', 'Warm', 'Hopeful', 'Building'] },
      ],
      imageUrl: '',
    },
    {
      id: 'hs1',
      name: 'hs1',
      displayName: 'HS1',
      description: 'Breaking free, rock influences, first steps alone',
      colorScheme: { primary: '#FFB6C1', secondary: '#000000', gradient: 'from-pink-300 via-rose-200 to-gray-800' },
      characterArchetypes: [
        { id: 'hs1-rebel', name: 'The Rebel', description: 'Stepping out of the mold everyone built for you', traits: ['Rebellious', 'Independent', 'Searching', 'Raw'] },
        { id: 'hs1-romantic', name: 'The Romantic', description: 'Heart on sleeve, learning through love and loss', traits: ['Romantic', 'Vulnerable', 'Passionate', 'Growing'] },
      ],
      imageUrl: '',
    },
  ],
  themes: ['Gender fluidity', 'Self-acceptance', 'Love without labels', 'Freedom', 'Vulnerability'],
  colorPalettes: [
    { name: 'Fine Line Pastel', colors: ['#FF69B4', '#98FB98', '#FFE4B5'] },
    { name: 'House Warm', colors: ['#FFE4B5', '#87CEEB', '#F5DEB3'] },
  ],
};

export const BTS_TEMPLATE: ArtistTemplate = {
  artistId: 'bts',
  name: 'BTS',
  imageUrl: '',
  description: 'Seven stories, one universe — from school to self-love',
  eras: [
    {
      id: 'wings',
      name: 'wings',
      displayName: 'Wings',
      description: 'Temptation, growth, finding your own wings to fly',
      colorScheme: { primary: '#000000', secondary: '#FF4500', gradient: 'from-black via-red-900 to-orange-600' },
      characterArchetypes: [
        { id: 'wings-rebel', name: 'The Rebel Angel', description: 'Questioning everything you were taught to believe', traits: ['Questioning', 'Brave', 'Growing', 'Defiant'] },
        { id: 'wings-dreamer', name: 'The Dreamer', description: 'Chasing impossible dreams against all expectations', traits: ['Dreaming', 'Determined', 'Hopeful', 'Persistent'] },
      ],
      imageUrl: '',
    },
    {
      id: 'love-yourself',
      name: 'love-yourself',
      displayName: 'Love Yourself',
      description: 'Self-love journey — from her to tear to answer',
      colorScheme: { primary: '#E6E6FA', secondary: '#FF69B4', gradient: 'from-purple-200 via-pink-300 to-lavender-200' },
      characterArchetypes: [
        { id: 'ly-seeker', name: 'The Self-Seeker', description: 'Learning that loving yourself is the hardest and most important journey', traits: ['Searching', 'Healing', 'Growing', 'Loving'] },
        { id: 'ly-healer', name: 'The Healer', description: 'Helping others love themselves while learning to do the same', traits: ['Empathetic', 'Nurturing', 'Wise', 'Healing'] },
      ],
      imageUrl: '',
    },
    {
      id: 'map-of-the-soul',
      name: 'map-of-the-soul',
      displayName: 'Map of the Soul',
      description: 'Jungian psychology, shadow and persona, identity',
      colorScheme: { primary: '#4169E1', secondary: '#FFD700', gradient: 'from-blue-600 via-indigo-500 to-yellow-400' },
      characterArchetypes: [
        { id: 'mots-shadow', name: 'The Shadow Self', description: 'Confronting the parts of yourself you hide from the world', traits: ['Honest', 'Courageous', 'Complex', 'Integrating'] },
        { id: 'mots-persona', name: 'The Persona', description: 'Struggling between who you are and who the world wants you to be', traits: ['Conflicted', 'Authentic', 'Evolving', 'Brave'] },
      ],
      imageUrl: '',
    },
  ],
  themes: ['Self-love', 'Youth', 'Mental health', 'Friendship', 'Identity', 'Dreams vs reality'],
  colorPalettes: [
    { name: 'Wings Dark', colors: ['#000000', '#FF4500', '#8B0000'] },
    { name: 'Love Yourself Soft', colors: ['#E6E6FA', '#FF69B4', '#FFB6C1'] },
    { name: 'MOTS Royal', colors: ['#4169E1', '#FFD700', '#191970'] },
  ],
};

export const CUSTOM_TEMPLATE: ArtistTemplate = {
  artistId: 'custom',
  name: 'Custom Artist',
  imageUrl: '',
  description: 'Create your own artist template with custom eras',
  eras: [],
  themes: [],
  colorPalettes: [],
};

// ── Registry ───────────────────────────────────────────

export const ARTIST_TEMPLATES: ArtistTemplate[] = [
  TAYLOR_SWIFT_TEMPLATE,
  BEYONCE_TEMPLATE,
  HARRY_STYLES_TEMPLATE,
  BTS_TEMPLATE,
  CUSTOM_TEMPLATE,
];

export function getArtistTemplate(artistId: string): ArtistTemplate | undefined {
  return ARTIST_TEMPLATES.find((t) => t.artistId === artistId);
}

export function getArtistEras(artistId: string): ArtistEra[] {
  return getArtistTemplate(artistId)?.eras ?? [];
}
