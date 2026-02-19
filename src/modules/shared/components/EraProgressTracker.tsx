import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Era {
  id: string;
  name: string;
  color: string;
  icon: string;
  year: string;
  completed: boolean;
}

export interface EraProgressTrackerProps {
  /** Which eras the user has completed stories in */
  completedEras?: string[];
  /** Callback when user clicks an era */
  onEraClick?: (eraId: string) => void;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ERAS: Era[] = [
  { id: 'debut', name: 'Debut', color: 'from-emerald-400 to-teal-500', icon: '🤠', year: '2006', completed: false },
  { id: 'fearless', name: 'Fearless', color: 'from-yellow-300 to-amber-500', icon: '⭐', year: '2008', completed: false },
  { id: 'speak-now', name: 'Speak Now', color: 'from-purple-400 to-violet-600', icon: '💜', year: '2010', completed: false },
  { id: 'red', name: 'Red', color: 'from-red-400 to-red-600', icon: '🧣', year: '2012', completed: false },
  { id: '1989', name: '1989', color: 'from-sky-300 to-blue-500', icon: '🕶️', year: '2014', completed: false },
  { id: 'reputation', name: 'Reputation', color: 'from-gray-600 to-black', icon: '🐍', year: '2017', completed: false },
  { id: 'lover', name: 'Lover', color: 'from-pink-300 to-rose-500', icon: '💕', year: '2019', completed: false },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const EraProgressTracker: React.FC<EraProgressTrackerProps> = ({
  completedEras = [],
  onEraClick,
  className,
}) => {
  const completedCount = completedEras.length;
  const progressPercent = Math.round((completedCount / ERAS.length) * 100);
  const allComplete = completedCount === ERAS.length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Era Progress</CardTitle>
          {allComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white border-0">
                ✨ All Eras ✨
              </Badge>
            </motion.div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedCount} of {ERAS.length} eras</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {ERAS.map((era) => {
            const isCompleted = completedEras.includes(era.id);
            return (
              <motion.button
                key={era.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEraClick?.(era.id)}
                className="flex flex-col items-center gap-1 group"
              >
                {/* Era circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300',
                    isCompleted
                      ? `bg-gradient-to-br ${era.color} shadow-lg shadow-${era.color.split(' ')[0]}/30`
                      : 'bg-muted/50 grayscale opacity-40'
                  )}
                >
                  {isCompleted ? era.icon : '🔒'}
                </div>

                {/* Era name */}
                <span
                  className={cn(
                    'text-[10px] font-medium leading-tight text-center',
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {era.name}
                </span>

                {/* Completion badge */}
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0, y: -5 }}
                    animate={{ scale: 1, y: 0 }}
                    className="text-xs"
                  >
                    ✅
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EraProgressTracker;

// TODO: API Integration
// - GET /api/users/:id/era-progress → returns completed era IDs
// - POST /api/stories → should update era progress when a story is created in a new era
// - Achievement unlock event when all 7 complete → trigger confetti + notification
