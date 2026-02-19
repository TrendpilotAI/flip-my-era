import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  month: string;
  title: string;
  description: string;
  era: string;
  bonusCredits: number;
  participantCount: number;
  endsAt: string; // ISO date
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  stories: number;
  likes: number;
}

export interface MonthlyChallengeProps {
  challenge?: Challenge;
  hasParticipated?: boolean;
  leaderboard?: LeaderboardEntry[];
  onParticipate?: () => void;
  className?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CHALLENGE: Challenge = {
  id: 'feb-2026',
  month: 'February 2026',
  title: 'Write a love story in the Lover era',
  description: 'Celebrate Valentine\'s month! Create a story set in the Lover era — pastel skies, butterflies, and love that lasts. Earn bonus credits for participating!',
  era: 'lover',
  bonusCredits: 5,
  participantCount: 247,
  endsAt: '2026-02-28T23:59:59Z',
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'LoverEra4Ever', stories: 8, likes: 234 },
  { rank: 2, name: 'SwiftWriter13', stories: 6, likes: 189 },
  { rank: 3, name: 'PastelDreams', stories: 5, likes: 156 },
  { rank: 4, name: 'CruelSummer22', stories: 4, likes: 112 },
  { rank: 5, name: 'MidnightRain', stories: 3, likes: 88 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: false };
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

// ─── Component ───────────────────────────────────────────────────────────────

export const MonthlyChallenge: React.FC<MonthlyChallengeProps> = ({
  challenge = MOCK_CHALLENGE,
  hasParticipated = false,
  leaderboard = MOCK_LEADERBOARD,
  onParticipate,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(challenge.endsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(challenge.endsAt));
    }, 60_000); // update every minute
    return () => clearInterval(timer);
  }, [challenge.endsAt]);

  // Days elapsed / total for progress
  const now = new Date();
  const endDate = new Date(challenge.endsAt);
  const startOfMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const totalDays = Math.ceil((endDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  const elapsed = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.round((elapsed / totalDays) * 100));

  return (
    <Card className={cn('overflow-hidden border-2 border-pink-300/50', className)}>
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 px-4 py-3">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-medium opacity-80">{challenge.month} Challenge</p>
            <h3 className="font-bold text-sm">{challenge.title}</h3>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-xs">
            +{challenge.bonusCredits} credits
          </Badge>
        </div>
      </div>

      <CardContent className="pt-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground">{challenge.description}</p>

        {/* Timer + stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-lg font-bold tabular-nums">
              {timeLeft.expired ? '🏁' : timeLeft.days}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {timeLeft.expired ? 'Ended' : 'days left'}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-lg font-bold tabular-nums">{challenge.participantCount}</div>
            <div className="text-[10px] text-muted-foreground">participants</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-lg font-bold">💕</div>
            <div className="text-[10px] text-muted-foreground">{challenge.era} era</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Month progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* CTA */}
        {!timeLeft.expired && (
          <Button
            className="w-full"
            variant={hasParticipated ? 'secondary' : 'default'}
            onClick={onParticipate}
            disabled={hasParticipated}
          >
            {hasParticipated ? '✅ You\'re in! Keep creating' : '✨ Join Challenge'}
          </Button>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Top Creators
          </h4>
          {leaderboard.map((entry) => (
            <div key={entry.rank} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 text-center">
                  {RANK_ICONS[entry.rank - 1] || entry.rank}
                </span>
                <span className={cn(entry.rank <= 3 && 'font-medium')}>{entry.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{entry.stories} stories</span>
                <span>❤️ {entry.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyChallenge;

// TODO: API Integration
// - GET /api/challenges/current → current month's challenge
// - GET /api/challenges/:id/leaderboard → top creators
// - POST /api/challenges/:id/join → mark user as participant
// - Auto-credit bonus when user creates a story matching the challenge era
// - Admin panel to set monthly challenges
