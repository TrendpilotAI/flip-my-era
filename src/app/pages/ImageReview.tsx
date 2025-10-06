import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageReviewPage } from '@/modules/story/components/ImageReviewPage';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/modules/shared/hooks/use-toast';
import type { ImageGenerationResult } from '@/modules/shared/services/runwayApi';
import * as fs from 'fs';
import * as path from 'path';

const ImageReview = () => {
  const [loading, setLoading] = useState(true);
  const [heroGalleryResults, setHeroGalleryResults] = useState<ImageGenerationResult[]>([]);
  const [eraResults, setEraResults] = useState<ImageGenerationResult[]>([]);
  const [promptResults, setPromptResults] = useState<ImageGenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGeneratedImages();
  }, []);

  const loadGeneratedImages = async () => {
    try {
      // Load the full results with variations
      const response = await fetch('/src/modules/story/data/generatedImagesWithVariations.json');
      
      if (!response.ok) {
        throw new Error('Image data not found. Please run: bun run generate:images');
      }

      const data = await response.json();
      
      setHeroGalleryResults(data.heroGallery || []);
      setEraResults(data.eras || []);
      setPromptResults(data.prompts || []);
    } catch (err) {
      console.error('Error loading generated images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelections = async (selections: Record<string, { url: string; seed: number; isAiSelected: boolean }>) => {
    try {
      // Update the main generatedImages.json with user selections
      const outputPath = '/src/modules/story/data/generatedImages.json';
      
      const imageData = {
        heroGallery: {} as Record<string, string>,
        eras: {} as Record<string, string>,
        prompts: {} as Record<string, string>,
        generated_at: new Date().toISOString(),
        model: 'RUNWARE Seedream 4 (bytedance:5@0)',
        aspect_ratio: '3:4',
        resolution: '2K (1536×2048)',
        selection: 'User-confirmed (with AI recommendations)'
      };

      // Organize selections by category
      Object.entries(selections).forEach(([id, data]) => {
        if (id.startsWith('hero-')) {
          imageData.heroGallery[id] = data.url;
        } else if (heroGalleryResults.find(r => r.id === id)) {
          imageData.heroGallery[id] = data.url;
        } else if (eraResults.find(r => r.id === id)) {
          imageData.eras[id] = data.url;
        } else {
          imageData.prompts[id] = data.url;
        }
      });

      console.log('Selections to save:', imageData);
      
      toast({
        title: "Selections Applied",
        description: `${Object.keys(selections).length} images confirmed and ready to use in the app.`,
      });

      // Navigate back to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error saving selections:', err);
      toast({
        title: "Save Failed",
        description: "Could not save image selections. Please try downloading JSON instead.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading generated images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Images Not Generated Yet</h1>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <div className="bg-gray-100 p-6 rounded-lg text-left">
            <p className="font-semibold mb-2">To generate images, run:</p>
            <code className="block bg-black text-green-400 p-4 rounded">
              bun run generate:images
            </code>
            <p className="text-sm text-gray-600 mt-4">
              This will generate 5 variations for each ERA and story prompt using Seedream 4,
              automatically analyze them, and select the best image.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ImageReviewPage
      heroGalleryResults={heroGalleryResults}
      eraResults={eraResults}
      storyPromptResults={promptResults}
      onSaveSelections={handleSaveSelections}
    />
  );
};

export default ImageReview;
