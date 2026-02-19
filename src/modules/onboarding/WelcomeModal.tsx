import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Sparkles, Clock, Star } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export function WelcomeModal({ open, onClose, onGetStarted }: WelcomeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className="relative h-40 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
                    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  />
                ))}
              </div>
              <div className="text-center text-white z-10">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <BookOpen className="w-12 h-12 mx-auto mb-2" />
                </motion.div>
                <h2 className="text-2xl font-bold">Welcome to FlipMyEra ✨</h2>
              </div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Create personalized AI storybooks inspired by your favorite eras.
                Beautiful illustrations, compelling stories — in under 60 seconds.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { icon: Sparkles, text: 'Choose from 7 unique era-inspired themes', color: 'text-purple-500' },
                  { icon: Clock, text: 'Get your illustrated ebook in under 60 seconds', color: 'text-pink-500' },
                  { icon: Star, text: '10 free credits — no credit card required', color: 'text-orange-500' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={onGetStarted}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:from-purple-700 hover:to-pink-600 py-6 text-lg font-semibold shadow-lg"
              >
                Pick Your Era & Start Creating
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Takes less than 60 seconds • Free to start
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
