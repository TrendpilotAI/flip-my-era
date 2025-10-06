import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, RefreshCw, Edit2, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { cn } from '@/core/lib/utils';
import { type Storyline } from '../services/storylineGeneration';

interface StorylinePreviewProps {
  storyline: Storyline;
  onBack: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onContinue: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export const StorylinePreview: React.FC<StorylinePreviewProps> = ({
  storyline,
  onBack,
  onRegenerate,
  onEdit,
  onContinue,
  isRegenerating = false,
  className
}) => {
  return (
    <motion.div
      className={cn("container mx-auto px-4 py-8 max-w-6xl", className)}
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
          Back to Details
        </Button>

        <div className="text-center">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your Storyline
          </motion.h1>
          <motion.p
            className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Review your story structure before generating the full narrative
          </motion.p>
        </div>
      </div>

      {/* Logline Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
              <Sparkles className="h-5 w-5" />
              Logline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 italic">
              "{storyline.logline}"
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Three-Act Structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-purple-500" />
          Three-Act Structure
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Act 1 */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
              <CardTitle className="text-blue-900 dark:text-blue-200">Act 1: Setup</CardTitle>
              <p className="text-sm text-blue-700 dark:text-blue-300">25% of story</p>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Setup</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act1.setup}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Inciting Incident</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act1.incitingIncident}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">First Plot Point</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act1.firstPlotPoint}</p>
              </div>
            </CardContent>
          </Card>

          {/* Act 2 */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
              <CardTitle className="text-purple-900 dark:text-purple-200">Act 2: Confrontation</CardTitle>
              <p className="text-sm text-purple-700 dark:text-purple-300">50% of story</p>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Rising Action</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act2.risingAction}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Midpoint</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act2.midpoint}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Dark Night of the Soul</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act2.darkNightOfTheSoul}</p>
              </div>
            </CardContent>
          </Card>

          {/* Act 3 */}
          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader className="bg-pink-50 dark:bg-pink-950/30">
              <CardTitle className="text-pink-900 dark:text-pink-200">Act 3: Resolution</CardTitle>
              <p className="text-sm text-pink-700 dark:text-pink-300">25% of story</p>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Climax</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act3.climax}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Resolution</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act3.resolution}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Closing Image</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{storyline.threeActStructure.act3.closingImage}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Chapter Outline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Chapter Outline
        </h2>

        <div className="space-y-4">
          {storyline.chapters.map((chapter, index) => (
            <Card key={chapter.number} className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Chapter {chapter.number}: {chapter.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {chapter.summary}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    ~{chapter.wordCountTarget} words
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total estimated word count: <span className="font-semibold">{storyline.wordCountTotal.toLocaleString()}</span>
          </p>
        </div>
      </motion.div>

      {/* Themes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Themes</h2>
        <div className="flex flex-wrap gap-3">
          {storyline.themes.map((theme, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-sm px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-900 dark:text-purple-200"
            >
              {theme}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-4 justify-center mt-12"
      >
        <Button
          variant="outline"
          onClick={onEdit}
          size="lg"
          className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <Edit2 className="h-5 w-5 mr-2" />
          Edit Details
        </Button>

        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isRegenerating}
          size="lg"
          className="border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/30"
        >
          {isRegenerating ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Regenerate
            </>
          )}
        </Button>

        <Button
          onClick={onContinue}
          size="lg"
          className="px-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          Continue to Format Selection
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
