import { describe, it, expect, beforeEach } from 'vitest';
import { flagContent, getModQueue, moderateFlag, getAllFlags, resetFlagStore } from '../ContentModeration';

describe('ContentModeration', () => {
  beforeEach(() => {
    resetFlagStore();
  });

  it('flags content and retrieves mod queue', async () => {
    await flagContent('ebook-1', 'Bad Book', 'user-1', 'Alice', 'spam', 'This is spam');
    await flagContent('ebook-2', 'Another', 'user-2', 'Bob', 'copyright', 'Copied content');

    const queue = await getModQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].status).toBe('pending');
  });

  it('moderates flags', async () => {
    const flag = await flagContent('ebook-1', 'Bad', 'user-1', 'Alice', 'inappropriate', 'NSFW');
    
    await moderateFlag(flag.id, 'rejected');
    
    const queue = await getModQueue();
    expect(queue).toHaveLength(0); // No longer pending

    const all = await getAllFlags();
    expect(all[0].status).toBe('rejected');
  });

  it('supports warn action', async () => {
    const flag = await flagContent('ebook-1', 'Test', 'user-1', 'Alice', 'other', 'Weird');
    const result = await moderateFlag(flag.id, 'warned');
    expect(result?.status).toBe('warned');
  });
});
