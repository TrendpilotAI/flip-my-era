import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Copy, Check, Users, DollarSign, TrendingUp, Link2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

export interface AffiliateStats {
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  totalEarnings: number;
  pendingPayout: number;
  conversionRate: number;
}

export interface AffiliateReferral {
  id: string;
  referredUserId: string;
  signedUpAt: string;
  convertedAt?: string;
  commissionAmount: number;
  status: 'pending' | 'converted' | 'paid';
}

export interface AffiliateConfig {
  commissionRate: number; // percentage (e.g. 20 = 20%)
  cookieDurationDays: number;
  minimumPayout: number;
  payoutSchedule: 'monthly' | 'weekly';
}

export const DEFAULT_AFFILIATE_CONFIG: AffiliateConfig = {
  commissionRate: 20,
  cookieDurationDays: 30,
  minimumPayout: 50,
  payoutSchedule: 'monthly',
};

// ─── Affiliate Code Generation ───────────────────────────────

export function generateAffiliateCode(userId: string): string {
  const hash = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `FME-AFF-${hash}`;
}

export function getAffiliateLink(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://flipmyera.com';
  return `${base}/?aff=${code}`;
}

// ─── In-memory tracking (swap for DB) ────────────────────────

const clickStore = new Map<string, number>();
const referralStore: AffiliateReferral[] = [];

export function trackClick(affiliateCode: string): void {
  clickStore.set(affiliateCode, (clickStore.get(affiliateCode) ?? 0) + 1);
}

export function recordReferralSignup(
  affiliateCode: string,
  referredUserId: string,
): AffiliateReferral {
  const referral: AffiliateReferral = {
    id: `ref_${Date.now()}`,
    referredUserId,
    signedUpAt: new Date().toISOString(),
    commissionAmount: 0,
    status: 'pending',
  };
  referralStore.push(referral);
  return referral;
}

export function recordConversion(
  referralId: string,
  purchaseAmount: number,
  config: AffiliateConfig = DEFAULT_AFFILIATE_CONFIG,
): AffiliateReferral | null {
  const referral = referralStore.find(r => r.id === referralId);
  if (!referral) return null;
  referral.status = 'converted';
  referral.convertedAt = new Date().toISOString();
  referral.commissionAmount = (purchaseAmount * config.commissionRate) / 100;
  return referral;
}

export function getAffiliateStats(affiliateCode: string): AffiliateStats {
  const clicks = clickStore.get(affiliateCode) ?? 0;
  const signups = referralStore.length;
  const conversions = referralStore.filter(r => r.status !== 'pending').length;
  const totalEarnings = referralStore.reduce((s, r) => s + r.commissionAmount, 0);
  const pendingPayout = referralStore
    .filter(r => r.status === 'converted')
    .reduce((s, r) => s + r.commissionAmount, 0);

  return {
    totalClicks: clicks,
    totalSignups: signups,
    totalConversions: conversions,
    totalEarnings,
    pendingPayout,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
  };
}

// ─── React Component ─────────────────────────────────────────

export default function AffiliateSystem() {
  const [copied, setCopied] = useState(false);
  // In production, get from auth context
  const affiliateCode = generateAffiliateCode('demo-user-id');
  const affiliateLink = getAffiliateLink(affiliateCode);
  const [stats, setStats] = useState<AffiliateStats>(getAffiliateStats(affiliateCode));

  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [affiliateLink]);

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Affiliate Program</h1>
        <p className="text-muted-foreground mt-2">
          Share FlipMyEra and earn {DEFAULT_AFFILIATE_CONFIG.commissionRate}% commission on every sale
        </p>
      </div>

      {/* Affiliate Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Your Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={affiliateLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {DEFAULT_AFFILIATE_CONFIG.cookieDurationDays}-day cookie • ${DEFAULT_AFFILIATE_CONFIG.minimumPayout} minimum payout
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Clicks" value={stats.totalClicks} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Signups" value={stats.totalSignups} />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Conversion"
          value={`${stats.conversionRate.toFixed(1)}%`}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Earnings"
          value={`$${stats.totalEarnings.toFixed(2)}`}
        />
      </div>

      {/* Payout Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">${stats.pendingPayout.toFixed(2)}</span>
            <Button disabled={stats.pendingPayout < DEFAULT_AFFILIATE_CONFIG.minimumPayout}>
              Request Payout
            </Button>
          </div>
          {stats.pendingPayout < DEFAULT_AFFILIATE_CONFIG.minimumPayout && (
            <p className="text-xs text-muted-foreground mt-2">
              Minimum payout is ${DEFAULT_AFFILIATE_CONFIG.minimumPayout}
            </p>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Share your unique link with friends and followers</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>They sign up and subscribe to a paid plan</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>You earn {DEFAULT_AFFILIATE_CONFIG.commissionRate}% commission on their subscription</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
