import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { type EraType } from '@/modules/story/types/eras';
import { useClerkAuth } from '@/modules/auth/contexts';
import { WelcomeModal } from './WelcomeModal';
import { TemplatePicker } from './TemplatePicker';
import { SamplePreview } from './SamplePreview';
import { Button } from '@/modules/shared/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ONBOARDING_SEEN_KEY = 'fme_onboarding_seen';

type OnboardingStep = 'welcome' | 'pick-era' | 'preview';

/**
 * OnboardingFlow — Complete first-time user experience
 *
 * Renders as an overlay/inline flow:
 * 1. Welcome modal (value prop)
 * 2. Template picker (visual era grid)
 * 3. Sample ebook preview with CTA
 *
 * After completion, navigates to the story wizard or auth.
 */
export function OnboardingFlow() {
  const { isAuthenticated } = useClerkAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedEra, setSelectedEra] = useState<EraType | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_SEEN_KEY);
    if (!seen) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(timer);
    } else {
      setDismissed(true);
    }
  }, []);

  const markSeen = useCallback(() => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, Date.now().toString());
  }, []);

  const handleWelcomeClose = useCallback(() => {
    setShowWelcome(false);
    markSeen();
    setDismissed(true);
  }, [markSeen]);

  const handleGetStarted = useCallback(() => {
    setShowWelcome(false);
    setStep('pick-era');
  }, []);

  const handleEraSelect = useCallback((era: EraType) => {
    setSelectedEra(era);
  }, []);

  const handleNextToPreview = useCallback(() => {
    if (selectedEra) setStep('preview');
  }, [selectedEra]);

  const handleCreateEbook = useCallback(() => {
    markSeen();
    if (isAuthenticated) {
      // Go to story creation with selected era pre-filled
      navigate('/dashboard', { state: { selectedEra } });
    } else {
      // Go to auth, then redirect to dashboard
      navigate('/auth', { state: { redirectTo: '/dashboard', selectedEra } });
    }
  }, [isAuthenticated, navigate, selectedEra, markSeen]);

  // If already seen onboarding, don't render anything
  if (dismissed && step === 'welcome') return null;

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcome}
        onClose={handleWelcomeClose}
        onGetStarted={handleGetStarted}
      />

      {/* Inline onboarding steps (shown after welcome modal) */}
      {step !== 'welcome' && !dismissed && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
            {/* Progress indicator */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                {(['pick-era', 'preview'] as const).map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        step === s
                          ? 'bg-purple-500 text-white'
                          : i < (['pick-era', 'preview'] as const).indexOf(step)
                          ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < 1 && (
                      <div className={`w-12 h-0.5 mx-1 ${
                        step === 'preview' ? 'bg-purple-300 dark:bg-purple-700' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 max-w-xs mx-auto">
                <span className={step === 'pick-era' ? 'text-purple-600 font-medium' : ''}>Choose Era</span>
                <span className={step === 'preview' ? 'text-purple-600 font-medium' : ''}>Preview</span>
              </div>
            </div>

            {/* Skip button */}
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWelcomeClose}
                className="text-gray-400 hover:text-gray-600"
              >
                Skip
              </Button>
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              {step === 'pick-era' && (
                <motion.div
                  key="pick-era"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <TemplatePicker selectedEra={selectedEra} onSelect={handleEraSelect} />
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleNextToPreview}
                      disabled={!selectedEra}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8"
                    >
                      See Preview
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'preview' && selectedEra && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <SamplePreview era={selectedEra} onCreateEbook={handleCreateEbook} />
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setStep('pick-era')}
                      className="text-gray-500"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Choose Different Era
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}

export default OnboardingFlow;
