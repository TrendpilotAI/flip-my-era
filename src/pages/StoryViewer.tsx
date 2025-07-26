import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { getStoryById } from '@/modules/story/utils/storyPersistence';
import { StoryResult } from '@/modules/story/components/StoryResult';
import { Button } from '@/modules/shared/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';

interface Story {
  id: string;
  title?: string;
  name: string;
  birth_date: string;
  initial_story: string;
  created_at: string;
  personality_type?: string;
  location?: string;
}

const StoryViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) {
        setError('No story ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getToken({ template: 'supabase' });
        const storyData = await getStoryById(id, token);
        
        if (storyData) {
          setStory(storyData);
        } else {
          setError('Story not found');
        }
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, getToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-gray-600">Loading your story...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Story Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The story you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6 text-purple-700 hover:bg-purple-100"
          onClick={() => navigate('/past-generations')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Past Generations
        </Button>

        {/* Story content */}
        <StoryResult result={story.initial_story} />
      </div>
    </div>
  );
};

export default StoryViewer; 