import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Input } from '@/modules/shared/components/ui/input';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Button } from '@/modules/shared/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group';
import { Label } from '@/modules/shared/components/ui/label';
import { Card } from '@/modules/shared/components/ui/card';
import { cn } from '@/core/lib/utils';
import { type CharacterArchetype } from '../types/eras';

type GenderType = "same" | "flip" | "neutral";

interface StoryDetailsFormProps {
  characterName: string;
  setCharacterName: (name: string) => void;
  selectedArchetype: CharacterArchetype | null;
  gender: GenderType;
  setGender: (gender: GenderType) => void;
  location: string;
  setLocation: (location: string) => void;
  customPrompt?: string;
  setCustomPrompt?: (prompt: string) => void;
  isCustomPrompt: boolean;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  className?: string;
}

export const StoryDetailsForm: React.FC<StoryDetailsFormProps> = ({
  characterName,
  setCharacterName,
  selectedArchetype,
  gender,
  setGender,
  location,
  setLocation,
  customPrompt,
  setCustomPrompt,
  isCustomPrompt,
  onBack,
  onGenerate,
  isGenerating,
  className
}) => {
  const canGenerate = characterName.trim().length > 0 && 
                     location.trim().length > 0 && 
                     (!isCustomPrompt || (customPrompt && customPrompt.trim().length > 0));

  return (
    <motion.div
      className={cn("container mx-auto px-4 py-8 max-w-4xl", className)}
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
          Back to Character Selection
        </Button>

        <div className="text-center">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Story Details
          </motion.h1>
          <motion.p
            className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Tell us about your character and story setting
          </motion.p>
        </div>
      </div>

      {/* Form Container */}
      <Card className="p-8 bg-white/90 backdrop-blur-lg border border-purple-100 dark:border-purple-900 shadow-xl">
        <div className="space-y-8">
          {/* Selected Archetype Display */}
          {selectedArchetype && (
            <motion.div
              className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">
                    Selected Character: {selectedArchetype.name}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedArchetype.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Character Name */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="character-name" className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span>Character Name</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </Label>
            <Input
              id="character-name"
              placeholder="Enter your character's name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="text-base py-2 border-purple-200 focus:border-purple-400 dark:border-purple-800 dark:focus:border-purple-600"
            />
          </motion.div>

          {/* Gender Selection */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span>Gender in Your Story</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </Label>
            <RadioGroup
              value={gender}
              onValueChange={(value: GenderType) => setGender(value)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 dark:has-[:checked]:bg-purple-950/30">
                <RadioGroupItem value="same" id="same" />
                <Label htmlFor="same" className="cursor-pointer flex-1">Keep Same</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 dark:has-[:checked]:bg-purple-950/30">
                <RadioGroupItem value="flip" id="flip" />
                <Label htmlFor="flip" className="cursor-pointer flex-1">Flip It!</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 dark:has-[:checked]:bg-purple-950/30">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral" className="cursor-pointer flex-1">Gender Neutral</Label>
              </div>
            </RadioGroup>
          </motion.div>

          {/* Location */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Label htmlFor="location" className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span>Story Location</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </Label>
            <Input
              id="location"
              placeholder="Enter the story location (e.g., Paris, New York, Tokyo)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-base py-2 border-purple-200 focus:border-purple-400 dark:border-purple-800 dark:focus:border-purple-600"
            />
          </motion.div>

          {/* Custom Prompt (if applicable) */}
          {isCustomPrompt && setCustomPrompt && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Label htmlFor="custom-prompt" className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>Your Story Prompt</span>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </Label>
              <Textarea
                id="custom-prompt"
                placeholder='Example: "Create a story about a shy girl who discovers she has a beautiful singing voice"'
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="text-base min-h-[120px] border-purple-200 focus:border-purple-400 dark:border-purple-800 dark:focus:border-purple-600"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Describe your story idea in a few sentences. Be as creative as you want!
              </p>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Generate Button */}
      <motion.div
        className="flex justify-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          size="lg"
          className="px-12 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isGenerating ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Generating Storyline...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Storyline
            </>
          )}
        </Button>
      </motion.div>

      <motion.p
        className="text-center mt-6 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        {!canGenerate 
          ? "Please fill in all fields to continue"
          : "Ready to create your storyline outline!"
        }
      </motion.p>
    </motion.div>
  );
};
