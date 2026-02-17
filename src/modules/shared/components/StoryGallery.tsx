import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GalleryStory {
  id: string;
  title: string;
  author: string;
  era: string;
  excerpt: string;
  likes: number;
  liked?: boolean;
  createdAt: string;
  coverEmoji?: string;
}

export interface StoryGalleryProps {
  stories?: GalleryStory[];
  onLike?: (storyId: string) => void;
  onReadStory?: (storyId: string) => void;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ERA_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  debut: { border: 'border-emerald-400/50', bg: 'bg-emerald-50 dark:bg-emerald-950/20', badge: 'bg-emerald-100 text-emerald-700' },
  fearless: { border: 'border-amber-400/50', bg: 'bg-amber-50 dark:bg-amber-950/20', badge: 'bg-amber-100 text-amber-700' },
  'speak-now': { border: 'border-purple-400/50', bg: 'bg-purple-50 dark:bg-purple-950/20', badge: 'bg-purple-100 text-purple-700' },
  red: { border: 'border-red-400/50', bg: 'bg-red-50 dark:bg-red-950/20', badge: 'bg-red-100 text-red-700' },
  '1989': { border: 'border-sky-400/50', bg: 'bg-sky-50 dark:bg-sky-950/20', badge: 'bg-sky-100 text-sky-700' },
  reputation: { border: 'border-gray-500/50', bg: 'bg-gray-50 dark:bg-gray-900/40', badge: 'bg-gray-200 text-gray-700' },
  lover: { border: 'border-pink-400/50', bg: 'bg-pink-50 dark:bg-pink-950/20', badge: 'bg-pink-100 text-pink-700' },
};

const ERA_NAMES: Record<string, string> = {
  debut: 'Debut', fearless: 'Fearless', 'speak-now': 'Speak Now',
  red: 'Red', '1989': '1989', reputation: 'Reputation', lover: 'Lover',
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_STORIES: GalleryStory[] = [
  { id: '1', title: 'Midnight Rain Confessions', author: 'SwiftWriter13', era: 'lover', excerpt: 'She found the letter tucked between pages of her favorite book, the ink slightly smudged from years of waiting...', likes: 42, coverEmoji: '💌', createdAt: '2026-02-16' },
  { id: '2', title: 'The Getaway Car', author: 'ReputationStan', era: 'reputation', excerpt: 'The city lights blurred past as they sped down the highway, leaving everything behind...', likes: 38, liked: true, coverEmoji: '🚗', createdAt: '2026-02-15' },
  { id: '3', title: 'Enchanted Evening', author: 'FearlessHeart', era: 'speak-now', excerpt: 'The ballroom shimmered with a thousand candles, and across the room, their eyes met...', likes: 55, coverEmoji: '✨', createdAt: '2026-02-14' },
  { id: '4', title: 'Wildest Dreams', author: 'ShakeItOff89', era: '1989', excerpt: 'New York was everything she imagined and nothing like she expected. The polaroid captured a moment...', likes: 67, coverEmoji: '🗽', createdAt: '2026-02-13' },
  { id: '5', title: 'Tim McGraw Summer', author: 'CountryRoads', era: 'debut', excerpt: 'That summer smelled like sunscreen and freshly cut grass. The truck radio played their song...', likes: 29, coverEmoji: '🌾', createdAt: '2026-02-12' },
  { id: '6', title: 'All Too Well', author: 'RedScarf22', era: 'red', excerpt: 'Autumn leaves fell like the pages of a story she wasn\'t ready to end...', likes: 89, coverEmoji: '🧣', createdAt: '2026-02-11' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const StoryGallery: React.FC<StoryGalleryProps> = ({
  stories = MOCK_STORIES,
  onLike,
  onReadStory,
  className,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({});

  const filteredStories = activeFilter === 'all'
    ? stories
    : stories.filter((s) => s.era === activeFilter);

  const handleLike = (storyId: string) => {
    setLocalLikes((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
    onLike?.(storyId);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Story Gallery</h2>
        <p className="text-sm text-muted-foreground">Community stories from every era ✨</p>
      </div>

      {/* Era filter */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('all')}
          className="text-xs h-7"
        >
          All Eras
        </Button>
        {Object.entries(ERA_NAMES).map(([id, name]) => (
          <Button
            key={id}
            size="sm"
            variant={activeFilter === id ? 'default' : 'outline'}
            onClick={() => setActiveFilter(id)}
            className="text-xs h-7"
          >
            {name}
          </Button>
        ))}
      </div>

      {/* Story grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredStories.map((story) => {
            const style = ERA_STYLES[story.era] || ERA_STYLES.lover;
            const isLiked = localLikes[story.id] ?? story.liked;

            return (
              <motion.div
                key={story.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn('border-2 hover:shadow-md transition-shadow', style.border)}>
                  <CardContent className="pt-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{story.coverEmoji}</span>
                          <h3 className="font-semibold text-sm truncate">{story.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">by {story.author}</p>
                      </div>
                      <Badge className={cn('text-[10px] shrink-0 border-0', style.badge)}>
                        {ERA_NAMES[story.era]}
                      </Badge>
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {story.excerpt}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleLike(story.id)}
                        className="flex items-center gap-1 text-sm hover:scale-110 transition-transform"
                      >
                        <motion.span
                          key={isLiked ? 'liked' : 'not'}
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                        >
                          {isLiked ? '❤️' : '🤍'}
                        </motion.span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {story.likes + (isLiked && !story.liked ? 1 : 0)}
                        </span>
                      </button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => onReadStory?.(story.id)}
                      >
                        Read Story →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-2xl mb-2">📖</p>
          <p className="text-sm">No stories in this era yet. Be the first!</p>
        </div>
      )}
    </div>
  );
};

export default StoryGallery;

// TODO: API Integration
// - GET /api/gallery?era=&page=&limit= → paginated public stories
// - POST /api/gallery/:id/like → toggle like
// - GET /api/gallery/:id → full story for "Read Story"
// - PATCH /api/stories/:id { shared: true } → "Share to Gallery" toggle
// - Add share toggle to story creation flow
