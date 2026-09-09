import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Sparkles, Clock, Star } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';
import { FREE_SIGNUP_CREDITS } from '@/config/stripe-products';

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
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-foreground">
              <div className="text-center text-white z-10">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <BookOpen className="w-12 h-12 mx-auto mb-2" />
                </motion.div>
                <h2 className="text-2xl font-bold">Welcome to FlipMyEra</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close welcome dialog"
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Create personalized AI storybooks inspired by your favorite eras.
                Build a story, generate illustrations, and follow its progress in one place.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { icon: Sparkles, text: 'Choose from 7 era-inspired themes', color: 'text-primary' },
                  { icon: Clock, text: 'Follow progress while your ebook is generated', color: 'text-sky-600' },
                  { icon: Star, text: `${FREE_SIGNUP_CREDITS} credits at signup; no card required`, color: 'text-amber-600' },
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
                className="w-full py-6 text-lg font-semibold shadow-lg"
              >
                Pick Your Era & Start Creating
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Free to start; generation time varies by project
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
