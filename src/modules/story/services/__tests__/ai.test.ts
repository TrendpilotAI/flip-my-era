import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Unmock AI service to test the real implementation
vi.unmock('@/modules/story/services/ai');

vi.mock('@/modules/shared/utils/apiWithRetry', () => ({
  apiRequestWithRetry: (config: any) => (axios as any)(config),
}));

import { generateStory, generateChapters, generateTaylorSwiftChapters, generateName } from '../ai';

vi.mock('axios');

const mockedAxios = axios as unknown as { request?: any } & typeof axios;

describe('AI services', () => {
  beforeEach(() => {
    (process as any).env.VITE_GROQ_API_KEY = 'gsk_test_key';
    (mockedAxios as any).request = vi.fn();
    (axios as any).default = axios;
  });

  it('generateStory returns assistant content', async () => {
    (mockedAxios as any).mockResolvedValueOnce({
      data: { choices: [{ message: { content: 'story text' } }] },
    });

    const text = await generateStory({ prompt: 'hello', maxTokens: 10, temperature: 0.5 });
    expect(text).toBe('story text');
  });

  it('generateChapters parses JSON object and returns chapters', async () => {
    const content = JSON.stringify({ chapters: [{ title: 'A', content: 'B' }] });
    (mockedAxios as any).mockResolvedValueOnce({
      data: { choices: [{ message: { content } }] },
    });

    const chapters = await generateChapters('base', 1);
    expect(chapters).toEqual([{ title: 'A', content: 'B' }]);
  });

  it('generateTaylorSwiftChapters uses format token limits and returns chapters', async () => {
    const content = JSON.stringify({ chapters: [{ title: 'TS1', content: 'TS2' }] });
    (mockedAxios as any).mockResolvedValueOnce({
      data: { choices: [{ message: { content } }] },
    });

    const chapters = await generateTaylorSwiftChapters('story', 'coming-of-age', 'novella', 2);
    expect(chapters.length).toBe(1);
    expect(chapters[0].title).toBe('TS1');
  });

  it('generateName returns only name', async () => {
    (mockedAxios as any).mockResolvedValueOnce({
      data: { choices: [{ message: { content: 'Ava' } }] },
    });
    const name = await generateName({ originalName: 'Anne', targetGender: 'female' });
    expect(name).toBe('Ava');
  });

  it('propagates errors as user-friendly messages', async () => {
    (mockedAxios as any).mockRejectedValueOnce(new Error('boom'));
    await expect(generateStory({ prompt: 'x' })).rejects.toThrow('Story generation failed');
  });
});

