/**
 * MSW request handlers for test mocking.
 * These intercept network requests at the service worker level,
 * providing more realistic mocking than vi.mock().
 */
import { http, HttpResponse } from 'msw';
import { MOCK_STORYLINE, MOCK_CHAPTER_EVENTS, MOCK_CREDIT_BALANCE, MOCK_CREDIT_VALIDATE } from './fixtures';

// Helper to create SSE response from events
function createSseResponse(events: ReadonlyArray<Record<string, unknown>>) {
  const body = events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
  return new HttpResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

/** Default handlers for happy-path scenarios */
export const handlers = [
  // Storyline generation
  http.post('*/functions/v1/groq-storyline', () => {
    return HttpResponse.json({
      success: true,
      storyline: MOCK_STORYLINE,
    });
  }),

  // Streaming chapter generation
  http.post('*/functions/v1/stream-chapters', () => {
    return createSseResponse(MOCK_CHAPTER_EVENTS);
  }),

  // Credit balance
  http.get('*/functions/v1/credits', () => {
    return HttpResponse.json(MOCK_CREDIT_BALANCE);
  }),

  http.post('*/functions/v1/credits', () => {
    return HttpResponse.json(MOCK_CREDIT_BALANCE);
  }),

  // Credit validation
  http.post('*/functions/v1/credits-validate', () => {
    return HttpResponse.json(MOCK_CREDIT_VALIDATE);
  }),
];

/** Error scenario handlers - use with server.use() in individual tests */
export const errorHandlers = {
  unauthorized: http.post('*/functions/v1/stream-chapters', () => {
    return new HttpResponse('unauthorized', { status: 401 });
  }),

  rateLimited: http.post('*/functions/v1/stream-chapters', () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }),

  serverError: http.post('*/functions/v1/stream-chapters', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  storylineUnauthorized: http.post('*/functions/v1/groq-storyline', () => {
    return HttpResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }),

  storylineRateLimited: http.post('*/functions/v1/groq-storyline', () => {
    return HttpResponse.json(
      { error: 'RATE_LIMITED' },
      { status: 429 }
    );
  }),

  creditsError: http.post('*/functions/v1/credits', () => {
    return HttpResponse.json(
      { error: 'Database unavailable' },
      { status: 503 }
    );
  }),

  streamError: http.post('*/functions/v1/stream-chapters', () => {
    return createSseResponse([
      { type: 'progress', currentChapter: 0, totalChapters: 1, progress: 0, message: 'init' },
      { type: 'error', message: 'Upstream error' },
    ]);
  }),
};
