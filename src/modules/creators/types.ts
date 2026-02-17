/** Creator Economy Types */

export type BadgeType = 'verified' | 'pro' | 'top-creator';

export interface CreatorBadge {
  type: BadgeType;
  label: string;
  color: string;
  icon: string;
  earnedAt?: string;
}

export interface VerificationCriteria {
  badgeType: BadgeType;
  minEbooks: number;
  minViews: number;
  minAccountAgeDays: number;
  minEarnings: number;
  description: string;
}

export const BADGE_CRITERIA: Record<BadgeType, VerificationCriteria> = {
  verified: {
    badgeType: 'verified',
    minEbooks: 5,
    minViews: 100,
    minAccountAgeDays: 30,
    minEarnings: 0,
    description: '5+ ebooks, 100+ views, 30+ day account',
  },
  pro: {
    badgeType: 'pro',
    minEbooks: 15,
    minViews: 1000,
    minAccountAgeDays: 90,
    minEarnings: 50,
    description: '15+ ebooks, 1K+ views, 90+ day account, $50+ earnings',
  },
  'top-creator': {
    badgeType: 'top-creator',
    minEbooks: 30,
    minViews: 10000,
    minAccountAgeDays: 180,
    minEarnings: 500,
    description: '30+ ebooks, 10K+ views, 180+ day account, $500+ earnings',
  },
};

export const BADGE_CONFIG: Record<BadgeType, Omit<CreatorBadge, 'earnedAt'>> = {
  verified: { type: 'verified', label: 'Verified', color: 'text-blue-500', icon: '✓' },
  pro: { type: 'pro', label: 'Pro Creator', color: 'text-purple-500', icon: '⭐' },
  'top-creator': { type: 'top-creator', label: 'Top Creator', color: 'text-amber-500', icon: '👑' },
};

export interface CreatorStats {
  totalEbooks: number;
  totalViews: number;
  totalShares: number;
  totalEarnings: number;
  accountAgeDays: number;
}

export interface Tip {
  id: string;
  fromUserId: string;
  fromName: string;
  toCreatorId: string;
  amount: number;
  message?: string;
  createdAt: string;
}

export const TIP_PRESETS = [1, 5, 10] as const;
export type TipPresetAmount = (typeof TIP_PRESETS)[number];

export interface CreatorProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  socialLinks: Record<string, string>;
  badges: CreatorBadge[];
  stats: CreatorStats;
}

export interface FeaturedCreatorData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  ebookCount: number;
  totalViews: number;
  featuredCover: string | null;
  badges: BadgeType[];
}

/**
 * Check which badges a creator qualifies for based on their stats.
 */
export function getEarnedBadges(stats: CreatorStats): BadgeType[] {
  const badges: BadgeType[] = [];
  for (const [type, criteria] of Object.entries(BADGE_CRITERIA) as [BadgeType, VerificationCriteria][]) {
    if (
      stats.totalEbooks >= criteria.minEbooks &&
      stats.totalViews >= criteria.minViews &&
      stats.accountAgeDays >= criteria.minAccountAgeDays &&
      stats.totalEarnings >= criteria.minEarnings
    ) {
      badges.push(type);
    }
  }
  return badges;
}

/**
 * Get the highest badge a creator has earned.
 */
export function getHighestBadge(stats: CreatorStats): BadgeType | null {
  const order: BadgeType[] = ['top-creator', 'pro', 'verified'];
  const earned = getEarnedBadges(stats);
  return order.find(b => earned.includes(b)) ?? null;
}
