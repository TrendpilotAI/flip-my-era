/**
 * EraRemix — Take an existing story and "remix" it into a different Taylor Swift era.
 * Shows original era, grid of target eras, before/after preview, and remix CTA.
 * @module story/components/EraRemix
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { cn } from '@/core/lib/utils';
import {
  Sparkles,
  ArrowRight,
  Sun,
  Crown,
  Wand2,
  Flame,
  Building2,
  Skull,
  Heart,
  TreePine,
  Leaf,
  Moon,
  RefreshCw,
} from 'lucide-react';

/** Shape of a story passed to EraRemix */
export interface EraRemixStory {
  title: string;
  era: string;
  chapters: Array<{ title: string; content: string }>;
}

export interface EraRemixProps {
  originalStory: EraRemixStory;
  onRemix: (targetEra: string) => void;
}

interface EraInfo {
  name: string;
  vibe: string;
  genre: string;
  gradient: string;
  bg: string;
  icon: React.ReactNode;
}

const ERA_MAP: Record<string, EraInfo> = {
  Debut:      { name: 'Debut',      vibe: 'Small town dreams',       genre: 'coming-of-age',   gradient: 'from-amber-300 to-yellow-500',       bg: 'bg-amber-50',    icon: <Sun className="w-5 h-5" /> },
  Fearless:   { name: 'Fearless',   vibe: 'Golden confidence',       genre: 'adventure',        gradient: 'from-yellow-400 to-amber-500',       bg: 'bg-yellow-50',   icon: <Crown className="w-5 h-5" /> },
  'Speak Now': { name: 'Speak Now', vibe: 'Fairytale magic',         genre: 'fairytale',        gradient: 'from-purple-400 to-violet-600',      bg: 'bg-purple-50',   icon: <Wand2 className="w-5 h-5" /> },
  Red:        { name: 'Red',        vibe: 'Passionate chaos',        genre: 'drama',            gradient: 'from-red-500 to-rose-600',           bg: 'bg-red-50',      icon: <Flame className="w-5 h-5" /> },
  '1989':     { name: '1989',       vibe: 'City lights & freedom',   genre: 'pop anthem',       gradient: 'from-sky-400 to-blue-500',           bg: 'bg-sky-50',      icon: <Building2 className="w-5 h-5" /> },
  Reputation: { name: 'Reputation', vibe: 'Dark & powerful',         genre: 'thriller',         gradient: 'from-gray-800 to-emerald-900',       bg: 'bg-gray-100',    icon: <Skull className="w-5 h-5" /> },
  Lover:      { name: 'Lover',      vibe: 'Pastel romance',          genre: 'romance',          gradient: 'from-pink-400 via-purple-400 to-blue-400', bg: 'bg-pink-50', icon: <Heart className="w-5 h-5" /> },
  Folklore:   { name: 'Folklore',   vibe: 'Woodland mystery',        genre: 'mystery',          gradient: 'from-emerald-700 to-gray-600',       bg: 'bg-emerald-50',  icon: <TreePine className="w-5 h-5" /> },
  Evermore:   { name: 'Evermore',    vibe: 'Autumn introspection',    genre: 'introspection',    gradient: 'from-orange-700 to-amber-900',       bg: 'bg-orange-50',   icon: <Leaf className="w-5 h-5" /> },
  Midnights:  { name: 'Midnights',  vibe: 'Sleepless confessions',   genre: 'confession',       gradient: 'from-indigo-800 to-purple-900',      bg: 'bg-indigo-50',   icon: <Moon className="w-5 h-5" /> },
};

const ALL_ERA_NAMES = Object.keys(ERA_MAP);

export const EraRemix: React.FC<EraRemixProps> = ({ originalStory, onRemix }) => {
  const [selectedEra, setSelectedEra] = useState<string | null>(null);

  const currentEra = ERA_MAP[originalStory.era] ?? ERA_MAP['Folklore']!;
  const targetEras = ALL_ERA_NAMES.filter((e) => e !== originalStory.era);

  const handleRemix = () => {
    if (selectedEra) onRemix(selectedEra);
  };

  const selectedInfo = selectedEra ? ERA_MAP[selectedEra] : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Original Story Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={cn('border-2 overflow-hidden', currentEra.bg)}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              <span>Original Story</span>
            </div>
            <CardTitle className="text-xl">{originalStory.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-white font-semibold bg-gradient-to-r', currentEra.gradient)}>
              {currentEra.icon}
              <span>{currentEra.name}</span>
            </div>
            <Badge variant="secondary">{originalStory.chapters.length} chapters</Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Target Era Grid */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Remix into…</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {targetEras.map((eraName, i) => {
            const era = ERA_MAP[eraName]!;
            const isSelected = selectedEra === eraName;
            return (
              <motion.button
                key={eraName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedEra(eraName)}
                className={cn(
                  'relative rounded-xl p-4 text-left transition-all border-2',
                  isSelected ? 'border-purple-500 ring-2 ring-purple-300 scale-[1.02]' : 'border-transparent hover:border-gray-300',
                  era.bg
                )}
              >
                <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r mb-2', era.gradient)}>
                  {era.icon}
                  {era.name}
                </div>
                <p className="text-xs text-muted-foreground">{era.vibe}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Before → After Preview */}
      <AnimatePresence>
        {selectedInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-dashed border-2 border-purple-300 bg-purple-50/50">
              <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
                {/* Original */}
                <div className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-white font-semibold bg-gradient-to-r', currentEra.gradient)}>
                  {currentEra.icon}
                  {currentEra.name}
                </div>

                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight className="w-6 h-6 text-purple-500" />
                </motion.div>

                {/* Target */}
                <div className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-white font-semibold bg-gradient-to-r', selectedInfo.gradient)}>
                  {selectedInfo.icon}
                  {selectedInfo.name}
                </div>
              </CardContent>
              <div className="px-6 pb-4 text-center">
                <p className="text-sm text-gray-600">
                  Your <strong>{currentEra.name}</strong> {currentEra.genre} becomes a{' '}
                  <strong>{selectedInfo.name}</strong> {selectedInfo.genre}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remix CTA */}
      <motion.div className="flex justify-center" layout>
        <Button
          size="lg"
          disabled={!selectedEra}
          onClick={handleRemix}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Remix for 1 credit
        </Button>
      </motion.div>
    </div>
  );
};

export default EraRemix;
