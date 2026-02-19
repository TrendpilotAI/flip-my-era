import { describe, it, expect } from 'vitest';
import {
  getEarnedBadges,
  getHighestBadge,
  BADGE_CRITERIA,
  BADGE_CONFIG,
  TIP_PRESETS,
  type CreatorStats,
  type BadgeType,
} from '../types';

const makeStats = (overrides: Partial<CreatorStats> = {}): CreatorStats => ({
  totalEbooks: 0,
  totalViews: 0,
  totalShares: 0,
  totalEarnings: 0,
  accountAgeDays: 0,
  ...overrides,
});

describe('Creator Badge System', () => {
  describe('getEarnedBadges', () => {
    it('returns empty array for new creator', () => {
      expect(getEarnedBadges(makeStats())).toEqual([]);
    });

    it('returns verified badge when criteria met', () => {
      const stats = makeStats({ totalEbooks: 5, totalViews: 100, accountAgeDays: 31 });
      expect(getEarnedBadges(stats)).toContain('verified');
    });

    it('does not return verified if ebooks below threshold', () => {
      const stats = makeStats({ totalEbooks: 4, totalViews: 100, accountAgeDays: 31 });
      expect(getEarnedBadges(stats)).not.toContain('verified');
    });

    it('does not return verified if views below threshold', () => {
      const stats = makeStats({ totalEbooks: 5, totalViews: 99, accountAgeDays: 31 });
      expect(getEarnedBadges(stats)).not.toContain('verified');
    });

    it('returns pro badge when criteria met', () => {
      const stats = makeStats({
        totalEbooks: 15, totalViews: 1000, accountAgeDays: 91, totalEarnings: 50,
      });
      const badges = getEarnedBadges(stats);
      expect(badges).toContain('pro');
      expect(badges).toContain('verified'); // also qualifies
    });

    it('returns top-creator badge when all criteria met', () => {
      const stats = makeStats({
        totalEbooks: 30, totalViews: 10000, accountAgeDays: 181, totalEarnings: 500,
      });
      const badges = getEarnedBadges(stats);
      expect(badges).toContain('top-creator');
      expect(badges).toContain('pro');
      expect(badges).toContain('verified');
    });

    it('does not return top-creator if earnings insufficient', () => {
      const stats = makeStats({
        totalEbooks: 30, totalViews: 10000, accountAgeDays: 181, totalEarnings: 499,
      });
      expect(getEarnedBadges(stats)).not.toContain('top-creator');
    });
  });

  describe('getHighestBadge', () => {
    it('returns null for no badges', () => {
      expect(getHighestBadge(makeStats())).toBeNull();
    });

    it('returns verified as highest when only verified earned', () => {
      const stats = makeStats({ totalEbooks: 5, totalViews: 100, accountAgeDays: 31 });
      expect(getHighestBadge(stats)).toBe('verified');
    });

    it('returns top-creator as highest when all earned', () => {
      const stats = makeStats({
        totalEbooks: 30, totalViews: 10000, accountAgeDays: 181, totalEarnings: 500,
      });
      expect(getHighestBadge(stats)).toBe('top-creator');
    });

    it('returns pro when pro but not top-creator', () => {
      const stats = makeStats({
        totalEbooks: 15, totalViews: 1000, accountAgeDays: 91, totalEarnings: 50,
      });
      expect(getHighestBadge(stats)).toBe('pro');
    });
  });

  describe('BADGE_CRITERIA', () => {
    it('has criteria for all three badge types', () => {
      expect(Object.keys(BADGE_CRITERIA)).toEqual(['verified', 'pro', 'top-creator']);
    });

    it('pro criteria are stricter than verified', () => {
      expect(BADGE_CRITERIA.pro.minEbooks).toBeGreaterThan(BADGE_CRITERIA.verified.minEbooks);
      expect(BADGE_CRITERIA.pro.minViews).toBeGreaterThan(BADGE_CRITERIA.verified.minViews);
    });

    it('top-creator criteria are stricter than pro', () => {
      expect(BADGE_CRITERIA['top-creator'].minEbooks).toBeGreaterThan(BADGE_CRITERIA.pro.minEbooks);
    });
  });

  describe('BADGE_CONFIG', () => {
    it('has config for all badge types', () => {
      const types: BadgeType[] = ['verified', 'pro', 'top-creator'];
      types.forEach(t => {
        expect(BADGE_CONFIG[t]).toBeDefined();
        expect(BADGE_CONFIG[t].label).toBeTruthy();
        expect(BADGE_CONFIG[t].color).toBeTruthy();
        expect(BADGE_CONFIG[t].icon).toBeTruthy();
      });
    });
  });

  describe('TIP_PRESETS', () => {
    it('contains expected preset amounts', () => {
      expect(TIP_PRESETS).toEqual([1, 5, 10]);
    });
  });
});
