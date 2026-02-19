import { describe, it, expect } from 'vitest';
import {
  generateAffiliateCode,
  getAffiliateLink,
  DEFAULT_AFFILIATE_CONFIG,
} from '../AffiliateSystem';

describe('Affiliate System', () => {
  describe('generateAffiliateCode', () => {
    it('generates a code from user ID', () => {
      const code = generateAffiliateCode('abc-123-def');
      expect(code).toMatch(/^FME-AFF-[A-Z0-9]+$/);
    });

    it('generates deterministic codes', () => {
      const code1 = generateAffiliateCode('user-123');
      const code2 = generateAffiliateCode('user-123');
      expect(code1).toBe(code2);
    });

    it('generates different codes for different users', () => {
      const code1 = generateAffiliateCode('user-aaa');
      const code2 = generateAffiliateCode('user-bbb');
      expect(code1).not.toBe(code2);
    });
  });

  describe('getAffiliateLink', () => {
    it('includes the affiliate code as query param', () => {
      const link = getAffiliateLink('FME-AFF-TEST1234');
      expect(link).toContain('?aff=FME-AFF-TEST1234');
    });
  });

  describe('DEFAULT_AFFILIATE_CONFIG', () => {
    it('has 20% commission rate', () => {
      expect(DEFAULT_AFFILIATE_CONFIG.commissionRate).toBe(20);
    });

    it('has 30-day cookie duration', () => {
      expect(DEFAULT_AFFILIATE_CONFIG.cookieDurationDays).toBe(30);
    });

    it('has $50 minimum payout', () => {
      expect(DEFAULT_AFFILIATE_CONFIG.minimumPayout).toBe(50);
    });
  });
});
