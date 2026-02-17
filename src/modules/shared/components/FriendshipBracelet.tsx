import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Referral {
  id: string;
  name: string;
  date: string;
  creditsEarned: number;
}

export interface FriendshipBraceletProps {
  /** User's unique referral code */
  referralCode?: string;
  /** Number of successful referrals */
  referralCount?: number;
  /** Total bonus credits earned from referrals */
  totalCreditsEarned?: number;
  /** Recent referrals list */
  recentReferrals?: Referral[];
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRACELET_COLORS = [
  'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-emerald-400',
  'bg-yellow-400', 'bg-red-400', 'bg-indigo-400', 'bg-rose-400',
];

const CREDITS_PER_REFERRAL = 3;

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_REFERRALS: Referral[] = [
  { id: '1', name: 'SwiftFan22', date: '2026-02-15', creditsEarned: 3 },
  { id: '2', name: 'ErasTourLover', date: '2026-02-10', creditsEarned: 3 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const FriendshipBracelet: React.FC<FriendshipBraceletProps> = ({
  referralCode = 'SWIFT-ABCD-1234',
  referralCount = 2,
  totalCreditsEarned = 6,
  recentReferrals = MOCK_REFERRALS,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://flipmyera.com/join?ref=${referralCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralLink]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          📿 Friendship Bracelet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your bracelet — you both get {CREDITS_PER_REFERRAL} bonus credits!
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bracelet visualization */}
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-0.5">
            {referralCode.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm',
                  char === '-' ? 'w-2 bg-transparent' : BRACELET_COLORS[i % BRACELET_COLORS.length]
                )}
              >
                {char !== '-' ? char : ''}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Referral link + copy */}
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-md px-3 py-2 text-xs font-mono truncate">
            {referralLink}
          </div>
          <Button
            size="sm"
            variant={copied ? 'secondary' : 'default'}
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{referralCount}</div>
            <div className="text-xs text-muted-foreground">Friends joined</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-500">+{totalCreditsEarned}</div>
            <div className="text-xs text-muted-foreground">Credits earned</div>
          </div>
        </div>

        {/* Recent referrals */}
        {recentReferrals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent Friends
            </h4>
            {recentReferrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between text-sm">
                <span>{ref.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  +{ref.creditsEarned} credits
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendshipBracelet;

// TODO: API Integration
// - GET /api/users/:id/referral → { referralCode, referralCount, totalCreditsEarned, recentReferrals }
// - POST /api/referral/validate?ref=CODE → validate + credit both users
// - Generate unique referral codes on user signup
// - Track referral source in analytics
