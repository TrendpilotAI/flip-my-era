import { describe, it, expect } from 'vitest';
import {
  SUBSCRIPTION_PLANS,
  canCreateEbook,
  getRemainingEbooks,
  hasCapability,
  getTierRank,
  isAtLeast,
  getUpgradeOptions,
  getAnnualSavings,
} from '../tiers';

describe('Subscription Tiers', () => {
  it('defines all four tiers', () => {
    expect(Object.keys(SUBSCRIPTION_PLANS)).toEqual(['free', 'basic', 'pro', 'enterprise']);
  });

  it('basic tier allows 3 ebooks per month', () => {
    expect(SUBSCRIPTION_PLANS.basic.limits.ebooksPerMonth).toBe(3);
  });

  it('pro tier has unlimited ebooks', () => {
    expect(SUBSCRIPTION_PLANS.pro.limits.ebooksPerMonth).toBeNull();
  });

  it('enterprise tier has API access', () => {
    expect(SUBSCRIPTION_PLANS.enterprise.limits.apiAccess).toBe(true);
  });

  it('free and basic tiers do NOT have API access', () => {
    expect(SUBSCRIPTION_PLANS.free.limits.apiAccess).toBe(false);
    expect(SUBSCRIPTION_PLANS.basic.limits.apiAccess).toBe(false);
  });

  describe('canCreateEbook', () => {
    it('allows basic user with 2 ebooks this month', () => {
      expect(canCreateEbook('basic', 2)).toBe(true);
    });

    it('blocks basic user at limit', () => {
      expect(canCreateEbook('basic', 3)).toBe(false);
    });

    it('always allows pro users', () => {
      expect(canCreateEbook('pro', 999)).toBe(true);
    });
  });

  describe('getRemainingEbooks', () => {
    it('returns correct remaining for basic', () => {
      expect(getRemainingEbooks('basic', 1)).toBe(2);
    });

    it('returns unlimited for pro', () => {
      expect(getRemainingEbooks('pro', 50)).toBe('unlimited');
    });

    it('returns 0 when at limit', () => {
      expect(getRemainingEbooks('basic', 5)).toBe(0);
    });
  });

  describe('hasCapability', () => {
    it('enterprise has whiteLabel', () => {
      expect(hasCapability('enterprise', 'whiteLabel')).toBe(true);
    });

    it('basic does not have whiteLabel', () => {
      expect(hasCapability('basic', 'whiteLabel')).toBe(false);
    });
  });

  describe('getTierRank', () => {
    it('ranks tiers correctly', () => {
      expect(getTierRank('free')).toBe(0);
      expect(getTierRank('enterprise')).toBe(3);
    });
  });

  describe('isAtLeast', () => {
    it('pro is at least basic', () => {
      expect(isAtLeast('pro', 'basic')).toBe(true);
    });

    it('basic is not at least pro', () => {
      expect(isAtLeast('basic', 'pro')).toBe(false);
    });
  });

  describe('getUpgradeOptions', () => {
    it('basic can upgrade to pro and enterprise', () => {
      const options = getUpgradeOptions('basic');
      expect(options.map(o => o.id)).toEqual(['pro', 'enterprise']);
    });

    it('enterprise has no upgrades', () => {
      expect(getUpgradeOptions('enterprise')).toEqual([]);
    });
  });

  describe('getAnnualSavings', () => {
    it('calculates savings for basic', () => {
      const savings = getAnnualSavings('basic');
      expect(savings).toBeCloseTo((9.99 - 7.99) * 12, 1);
    });

    it('free tier has no savings', () => {
      expect(getAnnualSavings('free')).toBe(0);
    });
  });
});
