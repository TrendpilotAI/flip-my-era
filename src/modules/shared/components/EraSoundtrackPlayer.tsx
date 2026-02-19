import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EraSoundtrackPlayerProps {
  currentEra: string;
  isGenerating: boolean;
}

interface EraSound {
  label: string;
  gradient: string;
  icon: string;
  setup: (ctx: AudioContext, gain: GainNode) => OscillatorNode[];
}

// ─── Era Sound Configurations ────────────────────────────────────────────────

const ERA_SOUNDS: Record<string, EraSound> = {
  debut: {
    label: 'Debut',
    gradient: 'from-emerald-400 to-teal-500',
    icon: '🤠',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(8, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      lfo.start();
      osc.start();
      return [osc, lfo];
    },
  },
  fearless: {
    label: 'Fearless',
    gradient: 'from-yellow-300 to-amber-500',
    icon: '⭐',
    setup: (ctx, gain) => {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(554, ctx.currentTime);
      const mix = ctx.createGain();
      mix.gain.setValueAtTime(0.5, ctx.currentTime);
      osc1.connect(mix);
      osc2.connect(mix);
      mix.connect(gain);
      osc1.start();
      osc2.start();
      return [osc1, osc2];
    },
  },
  'speak-now': {
    label: 'Speak Now',
    gradient: 'from-purple-400 to-violet-600',
    icon: '💜',
    setup: (ctx, gain) => {
      const oscs: OscillatorNode[] = [];
      [261, 329, 392].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(g);
        g.connect(gain);
        osc.start();
        oscs.push(osc);
      });
      return oscs;
    },
  },
  red: {
    label: 'Red',
    gradient: 'from-red-400 to-red-600',
    icon: '🧣',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(4, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      lfo.start();
      osc.start();
      return [osc, lfo];
    },
  },
  '1989': {
    label: '1989',
    gradient: 'from-sky-300 to-blue-500',
    icon: '🕶️',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(5, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(15, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      lfo.start();
      osc.start();
      return [osc, lfo];
    },
  },
  reputation: {
    label: 'Reputation',
    gradient: 'from-gray-600 to-black',
    icon: '🐍',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, ctx.currentTime);
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        dist.curve = curve;
        curve[i] = Math.tanh(x * 3);
      }
      osc.connect(dist);
      dist.connect(gain);
      osc.start();
      return [osc];
    },
  },
  lover: {
    label: 'Lover',
    gradient: 'from-pink-300 to-rose-500',
    icon: '💕',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(20, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4, ctx.currentTime);
      osc.connect(g);
      g.connect(gain);
      lfo.start();
      osc.start();
      return [osc, lfo];
    },
  },
  'folklore-evermore': {
    label: 'Folklore',
    gradient: 'from-amber-700 via-stone-600 to-amber-800',
    icon: '🍂',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(196, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(g);
      g.connect(gain);
      osc.start();
      return [osc];
    },
  },
  midnights: {
    label: 'Midnights',
    gradient: 'from-indigo-900 via-purple-800 to-blue-900',
    icon: '🌙',
    setup: (ctx, gain) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      lfo.start();
      osc.start();
      return [osc, lfo];
    },
  },
  showgirl: {
    label: 'Showgirl',
    gradient: 'from-orange-400 via-amber-300 to-teal-300',
    icon: '✨',
    setup: (ctx, gain) => {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(349, ctx.currentTime);
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      const mix = ctx.createGain();
      mix.gain.setValueAtTime(0.4, ctx.currentTime);
      osc1.connect(mix);
      osc2.connect(mix);
      mix.connect(gain);
      osc1.start();
      osc2.start();
      return [osc1, osc2];
    },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const EraSoundtrackPlayer: React.FC<EraSoundtrackPlayerProps> = ({
  currentEra,
  isGenerating,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(30);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const eraKey = currentEra.toLowerCase().replace(/\s+/g, '-');
  const eraSound = ERA_SOUNDS[eraKey] || ERA_SOUNDS['debut'];

  const stopAudio = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    oscillatorsRef.current = [];
  }, []);

  const startAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    stopAudio();

    const gain = ctx.createGain();
    const effectiveVol = isMuted ? 0 : volume / 100;
    gain.gain.setValueAtTime(effectiveVol * 0.15, ctx.currentTime);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    oscillatorsRef.current = eraSound.setup(ctx, gain);
    setIsPlaying(true);
  }, [eraSound, isMuted, volume, stopAudio]);

  // Auto-play when generating
  useEffect(() => {
    if (isGenerating) {
      startAudio();
    } else if (isPlaying) {
      // Fade out
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
        setTimeout(() => {
          stopAudio();
          setIsPlaying(false);
        }, 1100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating]);

  // Update volume
  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      const effectiveVol = isMuted ? 0 : volume / 100;
      gainRef.current.gain.setValueAtTime(effectiveVol * 0.15, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted]);

  // Restart when era changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopAudio();
      startAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraKey]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAudio();
      audioCtxRef.current?.close();
    };
  }, [stopAudio]);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className={cn(
          'fixed bottom-4 right-4 z-50 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl overflow-hidden',
          isExpanded ? 'w-64' : 'w-48'
        )}
      >
        {/* Gradient header */}
        <div
          className={cn(
            'bg-gradient-to-r p-3 cursor-pointer flex items-center gap-2',
            eraSound.gradient
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-lg">{eraSound.icon}</span>
          <span className="text-white text-sm font-semibold truncate">
            {eraSound.label}
          </span>
          {isPlaying && (
            <motion.div
              className="ml-auto flex gap-0.5"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-white rounded-full"
                  style={{ height: `${8 + i * 3}px` }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-black/80 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? '⏸' : '▶️'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? '🔇' : '🔊'}
            </Button>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1 text-center">
                {isPlaying ? 'Playing ambient sounds...' : 'Click play to start'}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EraSoundtrackPlayer;
