import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, FileText, Book, Clock, Coins, Check } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { cn } from '@/core/lib/utils';
import { type StoryFormat } from '../contexts/StoryWizardContext';

interface FormatOption {
  id: StoryFormat;
  name: string;
  icon: React.ReactNode;
  chapters: string;
  wordCount: string;
  estimatedTime: string;
  creditCost: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

const formatOptions: FormatOption[] = [
  {
    id: 'preview',
    name: 'Story Preview',
    icon: <FileText className="h-10 w-10" />,
    chapters: '1 chapter',
    wordCount: '500-1,000 words',
    estimatedTime: '2-3 minutes',
    creditCost: 1,
    description: 'Quick glimpse of your story to see if you love it',
    features: [
      'Single chapter preview',
      'Core story elements',
      'Fast generation',
      'Perfect for testing'
    ]
  },
  {
    id: 'short-story',
    name: 'Short Story',
    icon: <BookOpen className="h-10 w-10" />,
    chapters: '3-6 chapters',
    wordCount: '1,500-5,000 words',
    estimatedTime: '5-8 minutes',
    creditCost: 3,
    description: 'Complete narrative arc with rich detail',
    features: [
      'Full three-act structure',
      'Character development',
      'Multiple chapters',
      'Illustrated scenes'
    ],
    recommended: true
  },
  {
    id: 'novella',
    name: 'Novella',
    icon: <Book className="h-10 w-10" />,
    chapters: '8-12 chapters',
    wordCount: '10,000-25,000 words',
    estimatedTime: '15-20 minutes',
    creditCost: 5,
    description: 'Epic adventure with deep character exploration',
    features: [
      'Extended storyline',
      'Rich world-building',
      'Complex subplots',
      'Multiple illustrations'
    ]
  }
];

interface StoryFormatSelectorProps {
  selectedFormat: StoryFormat | null;
  onFormatSelect: (format: StoryFormat) => void;
  onBack: () => void;
  className?: string;
}

export const StoryFormatSelector: React.FC<StoryFormatSelectorProps> = ({
  selectedFormat,
  onFormatSelect,
  onBack,
  className
}) => {
  const [hoveredFormat, setHoveredFormat] = useState<StoryFormat | null>(null);

  return (
    <motion.div
      className={cn("container mx-auto px-4 py-8 max-w-7xl", className)}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Storyline
        </Button>

        <div className="text-center">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your Format
          </motion.h1>
          <motion.p
            className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Select the length and depth of your story
          </motion.p>
        </div>
      </div>

      {/* Format Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
          }
        }}
      >
        {formatOptions.map((format, index) => {
          const isSelected = selectedFormat === format.id;
          const isHovered = hoveredFormat === format.id;

          return (
            <motion.div
              key={format.id}
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
                    delay: index * 0.15
                  }
                }
              }}
            >
              <Card
                className={cn(
                  "relative cursor-pointer transition-all duration-300 h-full",
                  isSelected
                    ? "border-purple-500 border-2 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg"
                )}
                onClick={() => onFormatSelect(format.id)}
                onMouseEnter={() => setHoveredFormat(format.id)}
                onMouseLeave={() => setHoveredFormat(null)}
              >
                {/* Recommended Badge */}
                {format.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      Recommended
                    </Badge>
                  </div>
                )}

                {/* Selection Checkmark */}
                {isSelected && (
                  <motion.div
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={cn(
                    "mx-auto mb-4 p-4 rounded-full transition-colors",
                    isSelected
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    {format.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">{format.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {format.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="space-y-3 py-4 border-y border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Chapters:</span>
                      <span className="font-semibold">{format.chapters}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Word Count:</span>
                      <span className="font-semibold">{format.wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Time:
                      </span>
                      <span className="font-semibold">{format.estimatedTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        Cost:
                      </span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {format.creditCost} {format.creditCost === 1 ? 'credit' : 'credits'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Includes:
                    </p>
                    {format.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Select Button */}
                  <Button
                    className={cn(
                      "w-full mt-4",
                      isSelected
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFormatSelect(format.id);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select This Format'}
                  </Button>
                </CardContent>

                {/* Hover Glow Effect */}
                {(isHovered || isSelected) && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-pink-400/5 pointer-events-none rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.p
        className="text-center mt-8 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {selectedFormat 
          ? "Ready to generate! You'll be taken to the generation page."
          : "Select a format to begin generating your story"
        }
      </motion.p>
    </motion.div>
  );
};
