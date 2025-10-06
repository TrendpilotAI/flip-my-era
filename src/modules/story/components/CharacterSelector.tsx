import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { type EraType, getCharacterArchetypes, type CharacterArchetype } from '../types/eras';
import { cn } from '@/core/lib/utils';
import { Button } from '@/modules/shared/components/ui/button';

interface CharacterSelectorProps {
  selectedEra: EraType;
  selectedArchetype: string | null;
  onArchetypeSelect: (archetypeId: string) => void;
  onBack: () => void;
  onContinue: () => void;
  className?: string;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedEra,
  selectedArchetype,
  onArchetypeSelect,
  onBack,
  onContinue,
  className
}) => {
  const [hoveredArchetype, setHoveredArchetype] = useState<string | null>(null);
  const archetypes = getCharacterArchetypes(selectedEra);

  return (
    <motion.div
      className={cn("container mx-auto px-4 py-8 max-w-6xl", className)}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Back Button */}
      <div className="mb-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prompts
        </Button>

        <div className="text-center">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your Character
          </motion.h1>
          <motion.p
            className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Select the character archetype that best fits your story
          </motion.p>
        </div>
      </div>

      {/* Character Archetypes Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
          }
        }}
      >
        {archetypes.map((archetype, index) => {
          const isSelected = selectedArchetype === archetype.id;
          const isHovered = hoveredArchetype === archetype.id;

          return (
            <motion.div
              key={archetype.id}
              className={cn(
                "relative overflow-hidden rounded-2xl cursor-pointer group p-6 border-2 transition-all duration-300",
                isSelected 
                  ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 shadow-lg" 
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-900"
              )}
              onClick={() => onArchetypeSelect(archetype.id)}
              onMouseEnter={() => setHoveredArchetype(archetype.id)}
              onMouseLeave={() => setHoveredArchetype(null)}
              variants={{
                hidden: { y: 50, scale: 0.9, opacity: 0 },
                visible: {
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.08
                  }
                }
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection Checkmark */}
              {isSelected && (
                <motion.div
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              )}

              {/* Content */}
              <div className="relative z-10">
                <h3 className={cn(
                  "text-xl font-bold mb-3 transition-colors duration-200",
                  isSelected 
                    ? "text-purple-700 dark:text-purple-400" 
                    : "text-gray-900 dark:text-white"
                )}>
                  {archetype.name}
                </h3>

                <p className={cn(
                  "text-sm mb-4 transition-colors duration-200",
                  isSelected
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {archetype.description}
                </p>

                {/* Traits */}
                <div className="flex flex-wrap gap-2">
                  {archetype.traits.map((trait, traitIndex) => (
                    <motion.span
                      key={traitIndex}
                      className={cn(
                        "text-xs px-3 py-1 rounded-full transition-all duration-200",
                        isSelected
                          ? "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 + traitIndex * 0.05 }}
                    >
                      {trait}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Hover Glow Effect */}
              {(isHovered || isSelected) && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Continue Button */}
      <motion.div
        className="flex justify-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onContinue}
          disabled={!selectedArchetype}
          size="lg"
          className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          Continue to Story Details
        </Button>
      </motion.div>

      <motion.p
        className="text-center mt-6 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {selectedArchetype 
          ? "Great choice! Click continue to proceed."
          : "Select a character archetype to continue"
        }
      </motion.p>
    </motion.div>
  );
};
