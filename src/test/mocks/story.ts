/**
 * Shared story/ERA mock factory.
 * Creates deterministic story-related test data.
 */

export function createMockStoryline(overrides = {}) {
  return {
    logline: 'A teenage dreamer discovers a magical portal...',
    threeActStructure: {
      act1: { title: 'Act 1: Setup', summary: 'The beginning...' },
      act2: { title: 'Act 2: Conflict', summary: 'The challenge...' },
      act3: { title: 'Act 3: Resolution', summary: 'The ending...' },
    },
    chapters: [
      { number: 1, title: 'Chapter 1', summary: 'First chapter', wordCountTarget: 1500 },
      { number: 2, title: 'Chapter 2', summary: 'Second chapter', wordCountTarget: 2000 },
      { number: 3, title: 'Chapter 3', summary: 'Third chapter', wordCountTarget: 1800 },
    ],
    themes: ['self-discovery', 'courage'],
    wordCountTotal: 5300,
    ...overrides,
  };
}

export function createMockChapter(overrides = {}) {
  return {
    title: 'Chapter 1: The Discovery',
    content: 'Once upon a time in the Folklore era...',
    id: 'chapter-1',
    imageUrl: undefined,
    streamingContent: undefined,
    isStreaming: false,
    imagePrompt: null,
    ...overrides,
  };
}

export function createMockEra(id = 'folklore') {
  const eras: Record<string, { id: string; title: string; description: string; color: string }> = {
    folklore: { id: 'folklore', title: 'Folklore', description: 'A mystical forest adventure', color: '#8B7355' },
    '1989': { id: '1989', title: '1989', description: 'Synth-pop optimism', color: '#87CEEB' },
    red: { id: 'red', title: 'Red', description: 'Passionate autumn vibes', color: '#DC143C' },
    reputation: { id: 'reputation', title: 'Reputation', description: 'Dark and edgy', color: '#2F2F2F' },
    lover: { id: 'lover', title: 'Lover', description: 'Pastel romance', color: '#FFB6C1' },
    midnights: { id: 'midnights', title: 'Midnights', description: 'Late-night musings', color: '#191970' },
    showgirl: { id: 'showgirl', title: 'Showgirl', description: 'Glittering stage presence', color: '#FFD700' },
  };
  return eras[id] || eras.folklore;
}
