/**
 * VoiceNarration — AI voice narration interface for stories using Fish Audio TTS.
 * Voice selector, chapter cards, mini audio player, and audiobook generation CTA.
 * @module story/components/VoiceNarration
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Progress } from '@/modules/shared/components/ui/progress';
import { Separator } from '@/modules/shared/components/ui/separator';
import { cn } from '@/core/lib/utils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic,
  Download,
  Clock,
  Sparkles,
  Volume2,
  Check,
  ExternalLink,
} from 'lucide-react';

/** Story data for VoiceNarration */
export interface VoiceNarrationStory {
  title: string;
  chapters: Array<{ title: string; content: string }>;
}

export interface VoiceNarrationProps {
  story: VoiceNarrationStory;
  onGenerate: (voiceId: string) => void;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  color: string;
}

const VOICES: VoiceOption[] = [
  { id: 'autumn', name: 'Autumn',  description: 'Warm, storytelling tone',       bestFor: 'All eras',             color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'ivy',    name: 'Ivy',     description: 'Soft, whispery',                bestFor: 'Folklore / Evermore',  color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'stella', name: 'Stella',  description: 'Bright, energetic',             bestFor: '1989 / Fearless',      color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'rhett',  name: 'Rhett',   description: 'Deep, dramatic male voice',     bestFor: 'Reputation',           color: 'bg-gray-200 text-gray-800 border-gray-400' },
  { id: 'luna',   name: 'Luna',    description: 'Dreamy, ethereal',              bestFor: 'Midnights / Lover',    color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'blake',  name: 'Blake',   description: 'Neutral, clear narrator',       bestFor: 'Any story',            color: 'bg-slate-100 text-slate-800 border-slate-300' },
];

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

/** Count words in a string */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Format seconds → "Xh Ym" or "Xm" */
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

export const VoiceNarration: React.FC<VoiceNarrationProps> = ({ story, onGenerate }) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICES[0]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [downloadFormat, setDownloadFormat] = useState<'mp3' | 'm4a'>('mp3');

  const totalWords = useMemo(
    () => story.chapters.reduce((sum, ch) => sum + wordCount(ch.content), 0),
    [story.chapters]
  );
  const estimatedSeconds = (totalWords / 150) * 60;

  const chapterWords = useMemo(
    () => story.chapters.map((ch) => wordCount(ch.content)),
    [story.chapters]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-purple-500" />
          Voice Narration
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Turn "{story.title}" into an audiobook
        </p>
      </div>

      {/* Voice Selector */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-gray-600">Choose a voice</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VOICES.map((voice) => {
            const active = selectedVoice.id === voice.id;
            return (
              <motion.button
                key={voice.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedVoice(voice)}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all',
                  active ? 'border-purple-500 ring-2 ring-purple-300' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {active && <Check className="absolute top-2 right-2 w-4 h-4 text-purple-500" />}
                <div className="font-semibold text-sm">{voice.name}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{voice.description}</p>
                <Badge variant="secondary" className={cn('mt-2 text-[10px]', voice.color)}>
                  {voice.bestFor}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-xs gap-1 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Volume2 className="w-3 h-3" /> Preview coming soon
                </Button>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Estimated Duration */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Estimated duration</span>
          </div>
          <div className="text-right">
            <span className="font-bold">{formatDuration(estimatedSeconds)}</span>
            <span className="text-xs text-muted-foreground ml-2">({totalWords.toLocaleString()} words)</span>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-600">Chapters</h3>
        {story.chapters.map((chapter, i) => {
          const chDuration = formatDuration((chapterWords[i] / 150) * 60);
          const isActive = currentChapter === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => { setCurrentChapter(i); setProgress(0); }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all border',
                  isActive ? 'border-purple-300 bg-purple-50' : 'border-transparent hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                  isActive ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {isActive && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{chapter.title}</div>
                  <div className="text-xs text-muted-foreground">{chapterWords[i].toLocaleString()} words · ~{chDuration}</div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">Ch {i + 1}</Badge>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Mini Audio Player (mocked) */}
      <Card className="sticky bottom-4 shadow-lg">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate max-w-[60%]">
              {story.chapters[currentChapter]?.title ?? 'Select a chapter'}
            </span>
            <Badge variant="secondary" className="text-xs">
              {selectedVoice.name}
            </Badge>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1.5" />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-12">0:00</span>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={currentChapter === 0}
                onClick={() => { setCurrentChapter((c) => Math.max(0, c - 1)); setProgress(0); }}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={currentChapter === story.chapters.length - 1}
                onClick={() => { setCurrentChapter((c) => Math.min(story.chapters.length - 1, c + 1)); setProgress(0); }}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Speed control */}
            <button
              onClick={() => {
                const idx = SPEED_OPTIONS.indexOf(speed as typeof SPEED_OPTIONS[number]);
                setSpeed(SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]);
              }}
              className="text-xs font-mono font-semibold text-muted-foreground hover:text-gray-900 w-12 text-right"
            >
              {speed}×
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Download format */}
      <div className="flex items-center gap-3">
        <Download className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Download format:</span>
        {(['mp3', 'm4a'] as const).map((fmt) => (
          <Button
            key={fmt}
            size="sm"
            variant={downloadFormat === fmt ? 'default' : 'outline'}
            className="h-7 text-xs uppercase"
            onClick={() => setDownloadFormat(fmt)}
          >
            {fmt}
          </Button>
        ))}
      </div>

      {/* Generate CTA */}
      <Button
        size="lg"
        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg"
        onClick={() => onGenerate(selectedVoice.id)}
      >
        <Sparkles className="w-4 h-4" />
        Generate Full Audiobook — 3 credits
      </Button>

      {/* Fish Audio attribution */}
      <p className="text-xs text-center text-muted-foreground">
        Powered by{' '}
        <a
          href="https://fish.audio"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline hover:text-gray-700"
        >
          Fish Audio AI <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </div>
  );
};

export default VoiceNarration;
