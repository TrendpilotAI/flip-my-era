import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'supabase/functions/stream-chapters/index.ts'),
  'utf8',
);

describe('stream-chapters transactional contract', () => {
  it('uses the shared BetterAuth, service-role, and CORS boundary', () => {
    expect(source).toContain("verifyAuth(req)");
    expect(source).toContain('initSupabaseClient()');
    expect(source).toContain('handleCors(req)');
    expect(source).toContain('getCorsHeaders(req)');
    expect(source).not.toContain("Deno.env.get('SUPABASE_ANON_KEY')");
  });

  it('validates bounded client input before claiming credits', () => {
    const validationIndex = source.indexOf('parseStreamRequest(requestBody');
    const claimIndex = source.indexOf(".rpc('claim_generation_request'");

    expect(validationIndex).toBeGreaterThan(-1);
    expect(claimIndex).toBeGreaterThan(validationIndex);
    expect(source).toContain('MAX_ORIGINAL_STORY_LENGTH = 50_000');
    expect(source).toContain('MAX_CHAPTERS = 12');
    expect(source).toContain("return { error: 'A client idempotency key is required' }");
  });

  it('charges the existing advanced chapter-generation price', () => {
    expect(source).toContain("const CHAPTER_OPERATION_TYPE = 'chapter_generation'");
    expect(source).toContain('const CHAPTER_GENERATION_CREDITS = 3');
    expect(source).toContain("model_quality: 'advanced'");
    expect(source).toContain('p_operation_type: CHAPTER_OPERATION_TYPE');
    expect(source).toContain('p_credits: CHAPTER_GENERATION_CREDITS');
  });

  it('finalizes a cache, replays it, and refunds claimed failures', () => {
    expect(source).toContain(".rpc('complete_generation_request'");
    expect(source).toContain(".rpc('fail_generation_request'");
    expect(source).toContain("if (claim.outcome === 'replay')");
    expect(source).toContain("status: 'replay'");
    expect(source).toContain('await failClaim(errorCode, errorMessage)');
    expect(source).toContain("await failClaim('CLIENT_ABORTED'");
  });
});
