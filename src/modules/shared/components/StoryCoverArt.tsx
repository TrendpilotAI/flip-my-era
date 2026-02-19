import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoryCoverArtProps {
  title: string;
  era: string;
  authorName?: string;
  className?: string;
}

// ─── Era Themes ──────────────────────────────────────────────────────────────

interface EraTheme {
  gradient: string;
  textColor: string;
  icon: string;
  decorations: string[];
  badgeBg: string;
}

const ERA_THEMES: Record<string, EraTheme> = {
  debut: {
    gradient: 'from-emerald-400 via-teal-300 to-cyan-400',
    textColor: 'text-white',
    icon: '🤠',
    decorations: ['🌾', '🎸', '🦋'],
    badgeBg: 'bg-emerald-600/80',
  },
  fearless: {
    gradient: 'from-yellow-300 via-amber-400 to-orange-400',
    textColor: 'text-amber-900',
    icon: '⭐',
    decorations: ['✨', '⭐', '🌟'],
    badgeBg: 'bg-amber-600/80',
  },
  'speak-now': {
    gradient: 'from-purple-500 via-violet-400 to-fuchsia-500',
    textColor: 'text-white',
    icon: '💜',
    decorations: ['🦄', '💎', '🔮'],
    badgeBg: 'bg-purple-700/80',
  },
  red: {
    gradient: 'from-red-600 via-rose-500 to-orange-500',
    textColor: 'text-white',
    icon: '🧣',
    decorations: ['🍂', '🧣', '❤️‍🔥'],
    badgeBg: 'bg-red-800/80',
  },
  '1989': {
    gradient: 'from-sky-400 via-blue-300 to-indigo-400',
    textColor: 'text-white',
    icon: '🕶️',
    decorations: ['🌊', '🎧', '🌴'],
    badgeBg: 'bg-sky-600/80',
  },
  reputation: {
    gradient: 'from-gray-900 via-gray-800 to-black',
    textColor: 'text-white',
    icon: '🐍',
    decorations: ['🐍', '⚡', '🖤'],
    badgeBg: 'bg-gray-700/80',
  },
  lover: {
    gradient: 'from-pink-400 via-rose-300 to-purple-400',
    textColor: 'text-white',
    icon: '💕',
    decorations: ['💖', '🦋', '💝'],
    badgeBg: 'bg-pink-600/80',
  },
  'folklore-evermore': {
    gradient: 'from-stone-600 via-amber-700 to-stone-700',
    textColor: 'text-amber-100',
    icon: '🍂',
    decorations: ['🍃', '🌿', '🕯️'],
    badgeBg: 'bg-stone-700/80',
  },
  midnights: {
    gradient: 'from-indigo-900 via-purple-800 to-blue-900',
    textColor: 'text-purple-100',
    icon: '🌙',
    decorations: ['⭐', '🌙', '✨'],
    badgeBg: 'bg-indigo-800/80',
  },
  showgirl: {
    gradient: 'from-orange-400 via-amber-300 to-teal-300',
    textColor: 'text-white',
    icon: '✨',
    decorations: ['💃', '🎭', '✨'],
    badgeBg: 'bg-orange-600/80',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const StoryCoverArt: React.FC<StoryCoverArtProps> = ({
  title,
  era,
  authorName = 'A Swiftie',
  className,
}) => {
  const coverRef = useRef<HTMLDivElement>(null);
  const eraKey = era.toLowerCase().replace(/\s+/g, '-');
  const theme = ERA_THEMES[eraKey] || ERA_THEMES['debut'];

  const handleShare = useCallback(async () => {
    const shareText = `📖 "${title}" — a ${era} era story by ${authorName}\n\nCreated with FlipMyEra ✨`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }, [title, era, authorName]);

  const handleDownload = useCallback(() => {
    // Use print dialog as a simple "download" mechanism
    window.print();
  }, []);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Cover Art - 9:16 ratio */}
      <motion.div
        ref={coverRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className={cn(
          'relative w-[270px] h-[480px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br',
          theme.gradient
        )}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {theme.decorations.map((deco, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl opacity-30"
              style={{
                top: `${15 + i * 25}%`,
                left: `${10 + (i % 2) * 70}%`,
              }}
              animate={{
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + i,
                delay: i * 0.5,
              }}
            >
              {deco}
            </motion.span>
          ))}
          {/* Extra scattered decorations */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={`extra-${i}`}
              className="absolute text-sm opacity-20"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
              }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.3 }}
            >
              {theme.decorations[i % theme.decorations.length]}
            </motion.span>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6 justify-between">
          {/* Top - Era badge */}
          <div className="flex justify-center">
            <Badge className={cn('text-white border-0 text-xs', theme.badgeBg)}>
              {theme.icon} {era} Era
            </Badge>
          </div>

          {/* Center - Title */}
          <div className="flex-1 flex items-center justify-center px-2">
            <h2
              className={cn(
                'text-center font-serif text-3xl font-bold leading-tight',
                theme.textColor
              )}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {title}
            </h2>
          </div>

          {/* Bottom - Author + branding */}
          <div className="text-center space-y-2">
            <div className={cn('h-px w-16 mx-auto opacity-50 bg-current', theme.textColor)} />
            <p className={cn('text-sm font-medium opacity-80', theme.textColor)}>
              {authorName}
            </p>
            <p className={cn('text-[10px] opacity-40', theme.textColor)}>
              FlipMyEra ✨
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-1.5"
        >
          📤 Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1.5"
        >
          📥 Download
        </Button>
      </div>
    </div>
  );
};

export default StoryCoverArt;
