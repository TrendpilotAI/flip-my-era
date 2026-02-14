/**
 * Deterministic test fixtures for MSW handlers.
 * Used to provide consistent, predictable responses in tests.
 */

export const MOCK_STORYLINE = {
  logline: 'A teenage dreamer discovers a magical portal in the Folklore era...',
  threeActStructure: {
    act1: {
      title: 'Act 1: The Discovery',
      summary: 'Our hero discovers the mystical forest...',
    },
    act2: {
      title: 'Act 2: The Challenge',
      summary: 'Challenges emerge as our hero ventures deeper...',
    },
    act3: {
      title: 'Act 3: The Resolution',
      summary: 'The final confrontation and resolution...',
    },
  },
  chapters: [
    { number: 1, title: 'Chapter 1: The Discovery', summary: 'Walking through the autumn woods...', wordCountTarget: 1500 },
    { number: 2, title: 'Chapter 2: The Challenge', summary: 'Facing the guardian of the woods...', wordCountTarget: 2000 },
    { number: 3, title: 'Chapter 3: The Resolution', summary: 'Returning home changed forever...', wordCountTarget: 1800 },
  ],
  themes: ['self-discovery', 'courage', 'belonging'],
  wordCountTotal: 5300,
} as const;

export const MOCK_CHAPTER_EVENTS = [
  { type: 'progress', currentChapter: 1, totalChapters: 2, progress: 0, message: 'Starting generation...' },
  { type: 'chapter', currentChapter: 1, totalChapters: 2, chapterTitle: 'Chapter 1: The Discovery', chapterContent: 'Once upon a time in the Folklore era, a young dreamer wandered into the enchanted woods.' },
  { type: 'chapter', currentChapter: 2, totalChapters: 2, chapterTitle: 'Chapter 2: The Resolution', chapterContent: 'And so the adventure came to a close, with lessons learned and friendships forged.' },
  { type: 'complete', progress: 100, message: 'Generation complete' },
] as const;

export const MOCK_SINGLE_CHAPTER_EVENTS = [
  { type: 'progress', currentChapter: 1, totalChapters: 1, progress: 0, message: 'start' },
  { type: 'chapter', currentChapter: 1, totalChapters: 1, chapterTitle: 'Ch 1', chapterContent: 'Hello' },
  { type: 'complete', progress: 100, message: 'done' },
] as const;

export const MOCK_CREDIT_BALANCE = {
  success: true,
  data: {
    balance: 100,
  },
} as const;

export const MOCK_CREDIT_VALIDATE = {
  hasEnoughCredits: true,
  requiredCredits: 5,
  currentBalance: 100,
} as const;
