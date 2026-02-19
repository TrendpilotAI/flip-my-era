import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type EraType, ERA_CONFIG } from '@/modules/story/types/eras';
import eraImages from '@/modules/story/data/eraImages.json';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';

interface SamplePreviewProps {
  era: EraType;
  onCreateEbook: () => void;
}

// Sample story content per era (first few "pages")
const SAMPLE_STORIES: Partial<Record<EraType, { title: string; pages: string[] }>> = {
  'folklore-evermore': {
    title: 'Whispers in the Willows',
    pages: [
      'The morning mist curled through the old stone bridge like a secret waiting to be told. You pulled your cardigan tighter and stepped into the forest, where every leaf seemed to hum a forgotten melody.',
      'A cottage appeared between the birch trees — ivy-covered, warm-windowed, impossibly inviting. The door was already open, as if it had been expecting you all along.',
      '"Some stories write themselves," whispered a voice from the garden. "Yours has been waiting here since autumn began."',
    ],
  },
  'midnights': {
    title: 'The 3 AM Chronicles',
    pages: [
      'The city glittered below your window like a scattered constellation. At 3 AM, the world finally matched the tempo of your thoughts — restless, electric, unapologetically awake.',
      'Your phone buzzed with a message from someone you thought you\'d forgotten. The lavender haze of memory washed over you, blurring the line between what was and what could be.',
      '"Meet me where the streetlights end," it read. And despite every rational thought, you reached for your jacket.',
    ],
  },
  '1989': {
    title: 'Polaroid Summer',
    pages: [
      'The beach house smelled like sunscreen and new beginnings. You shook the Polaroid, watching your smile develop in real-time — proof that this summer was actually happening.',
      'The convertible\'s radio blasted your favorite song as the sunset painted everything in shades of possibility. Your best friend threw her hands up, screaming the lyrics into the wind.',
      '"This is what they mean by living," you laughed. The city skyline sparkled ahead like a promise you were finally ready to keep.',
    ],
  },
  'red': {
    title: 'Autumn in Fragments',
    pages: [
      'The leaves fell like love letters from a season that refused to end. You sat on the park bench, scarf wrapped tight, watching the world turn every shade of red you\'d ever felt.',
      'His voice still echoed in the coffee shop where you\'d spent three Octobers memorizing each other\'s favorite songs. The barista already knew your order. Some things stay.',
      '"Heartbreak is just love with the volume turned all the way up," you wrote in your journal. The ink bled a little. So did you. And that was okay.',
    ],
  },
  'reputation': {
    title: 'Phoenix Rising',
    pages: [
      'They said you were finished. The headlines screamed, the comments burned, and for a while, you believed every word. But silence has a way of becoming armor.',
      'You emerged not as who they expected, but as who you chose to be. The stadium lights hit differently when you know exactly who you are.',
      '"The old me? She\'s not dead," you said into the microphone. "She just stopped caring what you think." The crowd erupted. So did you.',
    ],
  },
  'lover': {
    title: 'Kaleidoscope Hearts',
    pages: [
      'The world had never looked so colorful. Pastel hearts adorned every window, every corner, every glance between you and the person who made everything feel possible.',
      'You danced in the rain without an umbrella because some moments are too perfect to shelter from. The rainbow appeared right on cue, like the universe was in on the joke.',
      '"I\'ve loved in whispers before," you said, paint-stained fingers intertwined. "But with you, I want to shout it from every rooftop in every color."',
    ],
  },
  'showgirl': {
    title: 'Spotlight & Sequins',
    pages: [
      'The spotlight found you before you found yourself. Under the stage lights, draped in sequins and certainty, you became someone the audience had never seen — because she\'d never existed until now.',
      'Between acts, you caught your reflection in the dressing room mirror. Glitter on your collarbone, fire in your eyes. "This is who I was always meant to be," you whispered.',
      'The final bow felt like the first breath of a new life. The crowd stood, the confetti fell, and somewhere in the chaos, you realized: the real show was just beginning.',
    ],
  },
};

export function SamplePreview({ era, onCreateEbook }: SamplePreviewProps) {
  const [page, setPage] = useState(0);
  const sample = SAMPLE_STORIES[era] || SAMPLE_STORIES['folklore-evermore']!;
  const img = eraImages[era as keyof typeof eraImages];
  const config = ERA_CONFIG[era];
  const totalPages = sample!.pages.length;

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text text-transparent dark:from-purple-100 dark:via-pink-200 dark:to-blue-100">
        Preview: {config.displayName} Era 📖
      </h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
        Here's a taste of what your personalized ebook will look like
      </p>

      {/* Book mockup */}
      <div className="max-w-md mx-auto">
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Book cover / illustration */}
          <div className="relative aspect-[3/2] overflow-hidden">
            {img ? (
              <img src={img} alt={config.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${config.colorScheme.gradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <p className="text-xs uppercase tracking-wider opacity-70">A FlipMyEra Story</p>
              <h3 className="text-lg font-bold">{sample!.title}</h3>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6 min-h-[180px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.p
                key={page}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic"
              >
                "{sample!.pages[page]}"
              </motion.p>
            </AnimatePresence>

            {/* Page navigation */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Blurred pages hint */}
        <div className="relative mt-3 mx-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center blur-[2px] select-none" aria-hidden>
            <p className="text-sm text-gray-500">The story continues with beautiful AI-generated illustrations and personalized chapters...</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-lg px-4 py-2 shadow-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Full story unlocked when you create
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-8">
        <Button
          onClick={onCreateEbook}
          size="lg"
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:from-purple-700 hover:to-pink-600 px-10 py-6 text-lg font-semibold shadow-lg"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Create Your First Ebook — Free
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Uses 2 credits • You have 10 free credits
        </p>
      </div>
    </div>
  );
}
