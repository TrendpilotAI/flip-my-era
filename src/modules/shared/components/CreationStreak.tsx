import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StreakMilestone {
  days: number;
  label: string;
  icon: string;
  description: string;
}

export interface CreationStreakProps {
  /** Current consecutive day streak */
  currentStreak: number;
  /** All-time longest streak */
  longestStreak: number;
  /** Whether the user has created a story today */
  createdToday?: boolean;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MILESTONES: StreakMilestone[] = [
  { days: 3, label: '3-Day Spark', icon: '✨', description: 'Getting started!' },
  { days: 7, label: 'Week Warrior', icon: '🔥', description: 'A whole week of stories!' },
  { days: 13, label: "Taylor's Lucky 13", icon: '🍀', description: "Taylor's favorite number!" },
  { days: 22, label: '22 ✨', icon: '🎉', description: 'I don\'t know about you, but I\'m feeling 22!' },
  { days: 30, label: 'Enchanted Month', icon: '💫', description: 'A whole month! Enchanted to meet you.' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const CreationStreak: React.FC<CreationStreakProps> = ({
  currentStreak,
  longestStreak,
  createdToday = false,
  className,
}) => {
  const nextMilestone = MILESTONES.find((m) => m.days > currentStreak);
  const reachedMilestones = MILESTONES.filter((m) => m.days <= currentStreak);
  const latestMilestone = reachedMilestones[reachedMilestones.length - 1];

  // Flame intensity based on streak length
  const flameSize = currentStreak >= 22 ? 'text-4xl' : currentStreak >= 13 ? 'text-3xl' : currentStreak >= 7 ? 'text-2xl' : 'text-xl';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {/* Animated flame/sparkle */}
          <motion.div
            animate={
              currentStreak > 0
                ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={cn(flameSize, 'select-none')}
          >
            {currentStreak === 0 ? '💤' : currentStreak >= 13 ? '🔥' : '✨'}
          </motion.div>

          {/* Streak info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{currentStreak}</span>
              <span className="text-sm text-muted-foreground">
                day{currentStreak !== 1 ? 's' : ''} streak
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>Best: {longestStreak} days</span>
              {createdToday ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  ✅ Today
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/50">
                  Create today to keep it!
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Milestone badges */}
        {reachedMilestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {reachedMilestones.map((m) => (
              <motion.div
                key={m.days}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <Badge
                  variant="secondary"
                  className="text-xs cursor-default"
                  title={m.description}
                >
                  {m.icon} {m.label}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}

        {/* Next milestone teaser */}
        {nextMilestone && (
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="opacity-60">
              Next: {nextMilestone.icon} {nextMilestone.label} in{' '}
              {nextMilestone.days - currentStreak} day{nextMilestone.days - currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreationStreak;

// TODO: API Integration
// - GET /api/users/:id/streak → { currentStreak, longestStreak, createdToday, lastCreatedAt }
// - Streak logic: compare lastCreatedAt to today's date; if gap > 1 day, reset
// - POST /api/stories → should bump streak on creation
// - Push notification: "Don't break your streak! Create a story today 🔥"
