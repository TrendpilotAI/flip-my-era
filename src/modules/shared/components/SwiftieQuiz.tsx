import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { cn } from '@/core/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SwiftieQuizProps {
  onEraSelected: (era: string) => void;
}

interface QuizOption {
  text: string;
  color?: string;
  weights: Record<string, number>;
}

interface QuizQuestion {
  question: string;
  subtitle?: string;
  options: QuizOption[];
}

// ─── Quiz Data ───────────────────────────────────────────────────────────────

const QUESTIONS: QuizQuestion[] = [
  {
    question: "It's Friday night. You're...",
    options: [
      { text: '🏡 Journaling by candlelight', weights: { 'folklore-evermore': 3, midnights: 1 } },
      { text: '💃 Dancing at a party', weights: { '1989': 3, showgirl: 2 } },
      { text: '🎤 Karaoke with friends', weights: { fearless: 2, 'speak-now': 2, red: 1 } },
      { text: '🖤 Plotting world domination', weights: { reputation: 3, midnights: 1 } },
      { text: '💖 Stargazing with someone special', weights: { lover: 3, debut: 1 } },
    ],
  },
  {
    question: 'Pick a color palette',
    subtitle: 'Trust your instincts ✨',
    options: [
      { text: 'Midnight blue & lavender', color: 'bg-gradient-to-r from-indigo-900 to-purple-300', weights: { midnights: 3, reputation: 1 } },
      { text: 'Pastel pink & blue', color: 'bg-gradient-to-r from-pink-300 to-sky-300', weights: { lover: 3, '1989': 1 } },
      { text: 'Forest green & gold', color: 'bg-gradient-to-r from-emerald-700 to-amber-400', weights: { 'folklore-evermore': 3, debut: 1 } },
      { text: 'Crimson & autumn orange', color: 'bg-gradient-to-r from-red-600 to-orange-400', weights: { red: 3, 'speak-now': 1 } },
      { text: 'Black & silver', color: 'bg-gradient-to-r from-gray-900 to-gray-400', weights: { reputation: 3, midnights: 1 } },
    ],
  },
  {
    question: 'Your ideal vacation?',
    options: [
      { text: '🏔️ Cozy cabin in the woods', weights: { 'folklore-evermore': 3, debut: 1 } },
      { text: '🗽 New York City shopping spree', weights: { '1989': 3, red: 1 } },
      { text: '🏖️ Beach resort, unlimited cocktails', weights: { lover: 2, showgirl: 2, fearless: 1 } },
      { text: '🏰 European castle tour', weights: { 'speak-now': 3, fearless: 1 } },
      { text: '🌃 Underground music scene in Berlin', weights: { reputation: 2, midnights: 2 } },
    ],
  },
  {
    question: 'Pick a lyric that speaks to you',
    options: [
      { text: '"I\'m the problem, it\'s me"', weights: { midnights: 3, reputation: 1 } },
      { text: '"Long story short, I survived"', weights: { 'folklore-evermore': 2, reputation: 2 } },
      { text: '"We are never getting back together"', weights: { red: 3, '1989': 1 } },
      { text: '"I want to be defined by the things I love"', weights: { lover: 3, debut: 1 } },
      { text: '"She\'s a showgirl, she\'s a fighter"', weights: { showgirl: 3, fearless: 1 } },
    ],
  },
  {
    question: 'Your current mood?',
    options: [
      { text: '✨ Main character energy', weights: { showgirl: 2, '1989': 2, fearless: 1 } },
      { text: '🥺 In my feelings', weights: { red: 2, 'folklore-evermore': 2 } },
      { text: '😈 Chaos mode', weights: { reputation: 3, midnights: 1 } },
      { text: '🥰 Hopelessly romantic', weights: { lover: 2, 'speak-now': 2, debut: 1 } },
      { text: '🌙 Sleepy but can\'t stop thinking', weights: { midnights: 3 } },
    ],
  },
];

const ERA_RESULTS: Record<string, { name: string; icon: string; gradient: string; tagline: string }> = {
  debut: { name: 'Debut', icon: '🤠', gradient: 'from-emerald-400 to-teal-500', tagline: 'You\'re a country heart with big city dreams!' },
  fearless: { name: 'Fearless', icon: '⭐', gradient: 'from-yellow-300 to-amber-500', tagline: 'You jump before you look — and always land on your feet!' },
  'speak-now': { name: 'Speak Now', icon: '💜', gradient: 'from-purple-400 to-violet-600', tagline: 'Fairytale energy with a rebellious streak!' },
  red: { name: 'Red', icon: '🧣', gradient: 'from-red-400 to-red-600', tagline: 'You feel everything at full volume. That\'s your superpower.' },
  '1989': { name: '1989', icon: '🕶️', gradient: 'from-sky-300 to-blue-500', tagline: 'Pop queen energy! You shake it off like nobody\'s business.' },
  reputation: { name: 'Reputation', icon: '🐍', gradient: 'from-gray-700 to-black', tagline: 'Dark, powerful, and unbothered. The old you can\'t come to the phone.' },
  lover: { name: 'Lover', icon: '💕', gradient: 'from-pink-300 to-rose-500', tagline: 'You believe in love, kindness, and glitter on everything.' },
  'folklore-evermore': { name: 'Folklore/Evermore', icon: '🍂', gradient: 'from-amber-700 to-stone-600', tagline: 'An old soul who finds poetry in the ordinary.' },
  midnights: { name: 'Midnights', icon: '🌙', gradient: 'from-indigo-900 to-purple-800', tagline: 'A beautiful mess of 3 AM thoughts and existential sparkle.' },
  showgirl: { name: 'Showgirl', icon: '✨', gradient: 'from-orange-400 to-teal-300', tagline: 'Born to perform! The stage is your second home.' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const SwiftieQuiz: React.FC<SwiftieQuizProps> = ({ onEraSelected }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((currentStep) / QUESTIONS.length) * 100;

  const resultEra = useMemo(() => {
    if (!isComplete) return null;
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'folklore-evermore';
  }, [isComplete, scores]);

  const result = resultEra ? ERA_RESULTS[resultEra] : null;

  const handleAnswer = (option: QuizOption) => {
    const newScores = { ...scores };
    Object.entries(option.weights).forEach(([era, weight]) => {
      newScores[era] = (newScores[era] || 0) + weight;
    });
    setScores(newScores);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `I got ${result.icon} ${result.name} era on the SwiftieQuiz! ${result.tagline}\n\nTake the quiz at FlipMyEra ✨`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const restart = () => {
    setCurrentStep(0);
    setScores({});
    setIsComplete(false);
  };

  return (
    <div className="max-w-lg mx-auto w-full">
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key={`q-${currentStep}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Progress */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentStep + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    {QUESTIONS[currentStep].question}
                  </h3>
                  {QUESTIONS[currentStep].subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {QUESTIONS[currentStep].subtitle}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {QUESTIONS[currentStep].options.map((option, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(option)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border border-border/50',
                        'hover:border-primary/50 hover:bg-accent/50 transition-colors',
                        'text-sm font-medium',
                        option.color && 'text-white border-0'
                      )}
                      style={option.color ? undefined : undefined}
                    >
                      {option.color ? (
                        <div className={cn('rounded-lg p-3', option.color)}>
                          {option.text}
                        </div>
                      ) : (
                        option.text
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              {/* Result header */}
              <div className={cn('bg-gradient-to-br p-8 text-center text-white', result.gradient)}>
                {/* Confetti / sparkles */}
                <div className="relative">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-xl"
                      style={{
                        left: `${10 + (i * 7)}%`,
                        top: `${-20 + (i % 3) * 10}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 360],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2 + i * 0.2,
                        delay: i * 0.15,
                      }}
                    >
                      {['✨', '⭐', '💫', '🎉'][i % 4]}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-3"
                >
                  {result.icon}
                </motion.div>
                <h2 className="text-3xl font-bold mb-1">You're {result.name}!</h2>
                <p className="text-white/80 text-sm max-w-xs mx-auto">
                  {result.tagline}
                </p>
              </div>

              {/* Actions */}
              <CardContent className="p-6 space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => onEraSelected(resultEra!)}
                >
                  ✨ Create a Story in {result.name}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    📤 Share Result
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={restart}
                  >
                    🔄 Retake
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default SwiftieQuiz;
