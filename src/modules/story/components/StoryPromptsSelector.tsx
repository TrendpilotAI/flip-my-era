import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { type EraType } from '../types/eras';
import { getPromptsByEra, type StoryPrompt } from '../data/storyPrompts';
import generatedImages from '../data/generatedImages.json';
import { cn } from '@/core/lib/utils';
import { Button } from '@/modules/shared/components/ui/button';

interface StoryPromptsSelectorProps {
  selectedEra: EraType;
  onPromptSelect: (promptId: string) => void;
  onBack: () => void;
  onCreateOwn: () => void;
  className?: string;
}

export const StoryPromptsSelector: React.FC<StoryPromptsSelectorProps> = ({
  selectedEra,
  onPromptSelect,
  onBack,
  onCreateOwn,
  className
}) => {
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);
  const prompts = getPromptsByEra(selectedEra);

  // Update imageUrls from generated images
  const promptsWithImages = prompts.map(prompt => ({
    ...prompt,
    imageUrl: generatedImages.prompts[prompt.id as keyof typeof generatedImages.prompts] || prompt.imageUrl
  }));

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
          Back to Eras
        </Button>

        <div className="text-center">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your Story
          </motion.h1>
          <motion.p
            className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Select a story prompt or create your own
          </motion.p>
        </div>
      </div>

      {/* Story Prompts Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {promptsWithImages.map((prompt, index) => (
          <motion.div
            key={prompt.id}
            className="relative overflow-hidden rounded-[28px] cursor-pointer group h-[460px] shadow-lg"
            onClick={() => onPromptSelect(prompt.id)}
            onMouseEnter={() => setHoveredPrompt(prompt.id)}
            onMouseLeave={() => setHoveredPrompt(null)}
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
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Image - 3:4 aspect ratio (vertical portrait) */}
            <div className="absolute inset-0">
              <img
                src={prompt.imageUrl}
                alt={prompt.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/55 to-black/25 group-hover:from-black/85 group-hover:via-black/45 transition-all duration-300" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0.9 }}
                animate={{ 
                  opacity: hoveredPrompt === prompt.id ? 1 : 0.9,
                  y: hoveredPrompt === prompt.id ? -8 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-white text-2xl font-semibold mb-3 drop-shadow-lg line-clamp-2">
                  {prompt.title}
                </h3>
                
                <p className="text-white/90 text-sm mb-4 line-clamp-4 drop-shadow-md">
                  {prompt.vibeCheck}
                </p>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-pink-400 text-xs font-semibold mt-0.5">💕</span>
                    <p className="text-pink-200 text-xs line-clamp-2 flex-1">
                      {prompt.genZHook}
                    </p>
                  </div>
                  
                  {hoveredPrompt === prompt.id && (
                    <motion.div
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <span className="text-purple-400 text-xs font-semibold mt-0.5">✨</span>
                      <p className="text-purple-200 text-xs line-clamp-3 flex-1">
                        {prompt.swiftieSignal}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Animated Border */}
              <motion.div
                className="absolute inset-0 rounded-[28px] border-2 border-white/0 group-hover:border-white/40 transition-colors duration-300"
                initial={false}
                animate={{
                  boxShadow: hoveredPrompt === prompt.id 
                    ? '0 0 25px rgba(255, 255, 255, 0.4)' 
                    : '0 0 0px rgba(255, 255, 255, 0)'
                }}
              />
            </div>
          </motion.div>
        ))}

        {/* Create Your Own Card */}
        <motion.div
          className="relative overflow-hidden rounded-[28px] cursor-pointer group h-[460px] border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors duration-300"
          onClick={onCreateOwn}
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
                delay: promptsWithImages.length * 0.08
              }
            }
          }}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4"
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
              Create Your Own
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Have a unique story idea? Start from scratch with a custom prompt
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        className="text-center mt-8 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Select a prompt to continue to character creation
      </motion.p>
    </motion.div>
  );
};
