/**
 * Netlify Function: auth
 *
 * Catch-all handler that forwards every request under /api/auth/* to
 * BetterAuth's request handler.  The netlify.toml redirect rule sends
 * `/api/auth/*` → `/.netlify/functions/auth`.
 *
 * Node 20+ is required (set NODE_VERSION = "20.17.0" in netlify.toml, already done).
 */
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { auth } from '../../src/lib/auth-server';

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Reconstruct the full URL so BetterAuth can parse the path / query params
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://flipmyera.com';
  const url = new URL(event.path + (event.rawQuery ? `?${event.rawQuery}` : ''), baseUrl);

  const request = new Request(url.toString(), {
    method: event.httpMethod,
    headers: event.headers as Record<string, string>,
    body: event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD'
      ? event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body
      : undefined,
  });

  try {
    const response = await auth.handler(request);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body,
    };
  } catch (err) {
    console.error('[auth function] Unhandled error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
