import { describe, it, expect } from 'vitest';
import { generateReferralCode } from '../ReferralSystem';

describe('generateReferralCode', () => {
  it('generates a code from user ID', () => {
    const code = generateReferralCode('abc123-def456-ghi789');
    expect(code).toMatch(/^FME-[A-Z0-9]{6}$/);
  });

  it('generates consistent codes for same user', () => {
    const id = 'user_abc123def456';
    expect(generateReferralCode(id)).toBe(generateReferralCode(id));
  });

  it('generates different codes for different users', () => {
    const code1 = generateReferralCode('user_111111');
    const code2 = generateReferralCode('user_222222');
    expect(code1).not.toBe(code2);
  });
});
