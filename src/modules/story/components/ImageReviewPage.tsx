import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Download, ChevronLeft, ChevronRight, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Checkbox } from '@/modules/shared/components/ui/checkbox';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { cn } from '@/core/lib/utils';
import type { ImageGenerationResult } from '@/modules/shared/services/runwayApi';
import { generateImageWithVariations } from '@/modules/shared/services/runwayApi';

interface ImageReviewPageProps {
  heroGalleryResults: ImageGenerationResult[];
  eraResults: ImageGenerationResult[];
  storyPromptResults: ImageGenerationResult[];
  onSaveSelections: (selections: Record<string, { url: string; seed: number; isAiSelected: boolean }>) => void;
  className?: string;
}

export const ImageReviewPage: React.FC<ImageReviewPageProps> = ({
  heroGalleryResults,
  eraResults,
  storyPromptResults,
  onSaveSelections,
  className
}) => {
  const { toast } = useToast();
  
  // Track selected image index for each prompt
  const [selectedImageIds, setSelectedImageIds] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    [...heroGalleryResults, ...eraResults, ...storyPromptResults].forEach(result => {
      initial[result.id] = result.bestImageIndex;
    });
    return initial;
  });

  // Track which selections were manually overridden
  const [manualOverrides, setManualOverrides] = useState<Set<string>>(new Set());

  // Track regenerating prompts
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());

  // Updated results with regenerations
  const [updatedResults, setUpdatedResults] = useState({
    heroGallery: heroGalleryResults,
    eras: eraResults,
    prompts: storyPromptResults
  });

  const [currentSection, setCurrentSection] = useState<'hero' | 'eras' | 'prompts'>('hero');

  const handleImageSelect = (resultId: string, variationIndex: number) => {
    setSelectedImageIds(prev => ({
      ...prev,
      [resultId]: variationIndex
    }));
    // Mark as manually overridden
    setManualOverrides(prev => new Set(prev).add(resultId));
  };

  const handleCheckboxToggle = (resultId: string, variationIndex: number, isChecked: boolean) => {
    if (isChecked) {
      handleImageSelect(resultId, variationIndex);
    }
  };

  const handleRegenerate = async (result: ImageGenerationResult, section: 'hero' | 'eras' | 'prompts') => {
    setRegenerating(prev => new Set(prev).add(result.id));
    
    try {
      toast({
        title: "Regenerating Images",
        description: `Generating 5 new variations for "${result.title}"...`,
      });

      // Find the original prompt data
      let vibeCheck, swiftieSignal, eraType;
      if (section === 'prompts') {
        const originalPrompt = storyPromptResults.find(r => r.id === result.id);
        // We need to pass these from the original data
        vibeCheck = result.title; // Placeholder - would need full data
        swiftieSignal = result.title;
        eraType = 'showgirl';
      }

      const newResult = await generateImageWithVariations({
        id: result.id,
        prompt: result.variations[0].url, // Use first variation as reference
        title: result.title,
        vibeCheck,
        swiftieSignal,
        eraType,
        numberResults: 5
      });

      // Update the results
      setUpdatedResults(prev => {
        const updated = { ...prev };
        const targetArray = section === 'hero' ? updated.heroGallery : section === 'eras' ? updated.eras : updated.prompts;
        const index = targetArray.findIndex(r => r.id === result.id);
        if (index !== -1) {
          targetArray[index] = newResult;
        }
        return updated;
      });

      // Update selection to best image from new results
      setSelectedImageIds(prev => ({
        ...prev,
        [result.id]: newResult.bestImageIndex
      }));

      // Remove manual override flag
      setManualOverrides(prev => {
        const newSet = new Set(prev);
        newSet.delete(result.id);
        return newSet;
      });

      toast({
        title: "Regeneration Complete",
        description: `New variations generated. Best image auto-selected.`,
      });
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate images",
        variant: "destructive",
      });
    } finally {
      setRegenerating(prev => {
        const newSet = new Set(prev);
        newSet.delete(result.id);
        return newSet;
      });
    }
  };

  const handleSaveSelections = () => {
    const selections: Record<string, { url: string; seed: number; isAiSelected: boolean }> = {};
    
    [...updatedResults.heroGallery, ...updatedResults.eras, ...updatedResults.prompts].forEach(result => {
      const selectedIndex = selectedImageIds[result.id] ?? result.bestImageIndex;
      const selectedVariation = result.variations[selectedIndex];
      selections[result.id] = {
        url: selectedVariation.url,
        seed: selectedVariation.seed,
        isAiSelected: !manualOverrides.has(result.id)
      };
    });

    onSaveSelections(selections);
    
    toast({
      title: "Selections Saved",
      description: `${Object.keys(selections).length} images saved successfully.`,
    });
  };

  const handleDownloadSelections = () => {
    const selections: Record<string, { url: string; seed: number; isAiSelected: boolean }> = {};
    
    [...updatedResults.heroGallery, ...updatedResults.eras, ...updatedResults.prompts].forEach(result => {
      const selectedIndex = selectedImageIds[result.id] ?? result.bestImageIndex;
      const selectedVariation = result.variations[selectedIndex];
      selections[result.id] = {
        url: selectedVariation.url,
        seed: selectedVariation.seed,
        isAiSelected: !manualOverrides.has(result.id),
        manuallySelected: manualOverrides.has(result.id)
      };
    });

    const dataStr = JSON.stringify(selections, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected-era-images.json';
    link.click();

    toast({
      title: "Downloaded",
      description: "Selected images exported to JSON file.",
    });
  };

  const currentResults = 
    currentSection === 'hero' ? updatedResults.heroGallery :
    currentSection === 'eras' ? updatedResults.eras : 
    updatedResults.prompts;

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'hero':
        return 'Hero Gallery Images';
      case 'eras':
        return 'ERA Selector Images';
      case 'prompts':
        return 'Story Prompt Images';
    }
  };

  const getSectionDescription = () => {
    switch (currentSection) {
      case 'hero':
        return 'Images for the landing page animated photo gallery';
      case 'eras':
        return 'Images for the ERA selection Bento grid cards';
      case 'prompts':
        return 'Images for individual story prompt cards';
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Image Generation Review
          </motion.h1>
          <p className="text-lg text-gray-600 mb-4">
            Review all generated images and confirm selections. Best images are automatically highlighted.
          </p>
          <Badge variant="outline" className="text-sm">
            Seedream 4 • 2K (1536×2048) • 3:4 Portrait • WEBP
          </Badge>
        </div>

        {/* Section Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={currentSection === 'hero' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('hero')}
            className={cn(
              currentSection === 'hero' && 'bg-gradient-to-r from-purple-600 to-pink-600'
            )}
          >
            Hero Gallery ({updatedResults.heroGallery.length})
          </Button>
          <Button
            variant={currentSection === 'eras' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('eras')}
            className={cn(
              currentSection === 'eras' && 'bg-gradient-to-r from-purple-600 to-pink-600'
            )}
          >
            ERA Images ({updatedResults.eras.length})
          </Button>
          <Button
            variant={currentSection === 'prompts' ? 'default' : 'outline'}
            onClick={() => setCurrentSection('prompts')}
            className={cn(
              currentSection === 'prompts' && 'bg-gradient-to-r from-purple-600 to-pink-600'
            )}
          >
            Story Prompts ({updatedResults.prompts.length})
          </Button>
        </div>

        {/* Section Description */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{getSectionTitle()}</h2>
          <p className="text-gray-600">{getSectionDescription()}</p>
        </div>

        {/* Image Grid */}
        <div className="space-y-12">
          {currentResults.map((result, index) => {
            const selectedIndex = selectedImageIds[result.id] ?? result.bestImageIndex;
            const isBestSelected = selectedIndex === result.bestImageIndex;
            const isManualOverride = manualOverrides.has(result.id);
            const isRegenerating = regenerating.has(result.id);

            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{result.title}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          {isBestSelected && !isManualOverride && (
                            <Badge className="bg-green-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              AI Recommended
                            </Badge>
                          )}
                          {isManualOverride && (
                            <Badge className="bg-blue-500 text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Manual Selection
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRegenerate(result, currentSection)}
                        disabled={isRegenerating}
                        variant="outline"
                        className="border-purple-300 hover:bg-purple-50"
                      >
                        {isRegenerating ? (
                          <>
                            <motion.div
                              className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full mr-2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Image Variations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      {result.variations.map((variation, varIndex) => {
                        const isSelected = varIndex === selectedIndex;
                        const isBest = varIndex === result.bestImageIndex;

                        return (
                          <motion.div
                            key={varIndex}
                            className={cn(
                              "relative rounded-lg overflow-hidden border-4 transition-all group",
                              isSelected 
                                ? "border-purple-500 shadow-xl" 
                                : "border-gray-200 hover:border-purple-300"
                            )}
                            whileHover={{ scale: 1.02 }}
                          >
                            {/* Image */}
                            <img
                              src={variation.url}
                              alt={`${result.title} - Variation ${varIndex + 1}`}
                              className="w-full h-auto object-cover aspect-[3/4] cursor-pointer"
                              onClick={() => handleImageSelect(result.id, varIndex)}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Checkbox Selector */}
                            <div className="absolute top-2 right-2 z-10">
                              <div 
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                  isSelected 
                                    ? "bg-purple-500 shadow-lg" 
                                    : "bg-white/80 hover:bg-white border-2 border-gray-300"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageSelect(result.id, varIndex);
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleCheckboxToggle(result.id, varIndex, checked as boolean)}
                                  className="pointer-events-none"
                                />
                              </div>
                            </div>

                            {/* Best Badge */}
                            {isBest && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                  <Star className="h-3 w-3 mr-1" />
                                  AI Best
                                </Badge>
                              </div>
                            )}

                            {/* Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">#{varIndex + 1}</span>
                                {variation.score && (
                                  <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                                    Score: {variation.score}/10
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] opacity-90">Seed: {variation.seed}</div>
                              {variation.cost && (
                                <div className="text-[10px] opacity-75">${variation.cost.toFixed(4)}</div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Selected Image Info */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-purple-900 mb-1">
                            Selected: Variation #{selectedIndex + 1}
                            {isManualOverride && <span className="text-blue-600"> (Your Choice)</span>}
                            {!isManualOverride && <span className="text-green-600"> (AI Selected)</span>}
                          </p>
                          {result.bestImage.reasoning && isBestSelected && !isManualOverride && (
                            <p className="text-sm text-gray-700 mt-2">
                              <strong>AI Analysis:</strong> {result.bestImage.reasoning}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>2K Quality (1536×2048)</div>
                          <div>Seed: {result.variations[selectedIndex].seed}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation & Actions */}
        <div className="flex justify-center gap-4 mt-12 flex-wrap">
          {currentSection === 'eras' && (
            <Button
              variant="outline"
              onClick={() => setCurrentSection('hero')}
              size="lg"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Hero Gallery
            </Button>
          )}
          {currentSection === 'prompts' && (
            <Button
              variant="outline"
              onClick={() => setCurrentSection('eras')}
              size="lg"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to ERA Images
            </Button>
          )}
          
          {currentSection === 'hero' && (
            <Button
              onClick={() => setCurrentSection('eras')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              Continue to ERA Images
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          
          {currentSection === 'eras' && (
            <Button
              onClick={() => setCurrentSection('prompts')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              Continue to Story Prompts
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          
          {currentSection === 'prompts' && (
            <>
              <Button
                onClick={handleDownloadSelections}
                size="lg"
                variant="outline"
                className="border-blue-300 hover:bg-blue-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Download JSON
              </Button>
              <Button
                onClick={handleSaveSelections}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
              >
                <Save className="h-5 w-5 mr-2" />
                Save & Apply Selections
              </Button>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 space-y-2 text-center text-sm text-gray-600">
          <p>
            <strong>Total Prompts:</strong> {updatedResults.heroGallery.length + updatedResults.eras.length + updatedResults.prompts.length}
            {' • '}
            <strong>Total Images:</strong> {(updatedResults.heroGallery.length + updatedResults.eras.length + updatedResults.prompts.length) * 5}
          </p>
          <p>
            <strong>AI Selections:</strong> {[...updatedResults.heroGallery, ...updatedResults.eras, ...updatedResults.prompts].length - manualOverrides.size}
            {' • '}
            <strong>Manual Selections:</strong> {manualOverrides.size}
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Model: Seedream 4 (bytedance:5@0) • Resolution: 2K (1536×2048) • Format: WEBP • Aspect: 3:4
          </p>
        </div>
      </div>
    </div>
  );
};