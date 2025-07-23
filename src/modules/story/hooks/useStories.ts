import { useState, useEffect } from 'react';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { storiesAPI, type Story } from '@/core/api/stories';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';

export const useStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, getToken } = useClerkAuth();

  const loadStories = async () => {
    if (!user?.id) {
      setStories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const fetchedStories = await storiesAPI.getStories(token);
      setStories(fetchedStories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stories';
      setError(errorMessage);
      toast({
        title: "Error loading stories",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (storyData: Omit<Story, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const newStory = await storiesAPI.createStory(storyData, token);
      setStories(prev => [newStory, ...prev]);
      toast({
        title: "Story saved successfully",
        description: "Your story has been saved to your library",
      });
      return newStory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save story';
      toast({
        title: "Error saving story",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateStory = async (id: string, updates: Partial<Story>) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const updatedStory = await storiesAPI.updateStory(id, updates, token);
      setStories(prev => prev.map(story => 
        story.id === id ? updatedStory : story
      ));
      toast({
        title: "Story updated successfully",
        description: "Your story has been updated",
      });
      return updatedStory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update story';
      toast({
        title: "Error updating story",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteStory = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      await storiesAPI.deleteStory(id, token);
      setStories(prev => prev.filter(story => story.id !== id));
      toast({
        title: "Story deleted successfully",
        description: "Your story has been removed",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete story';
      toast({
        title: "Error deleting story",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getStoryById = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return await storiesAPI.getStory(id, token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load story';
      toast({
        title: "Error loading story",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Load stories when user changes
  useEffect(() => {
    if (user?.id) {
      loadStories();
    } else {
      setStories([]);
    }
  }, [user?.id]);

  return {
    stories,
    loading,
    error,
    loadStories,
    createStory,
    updateStory,
    deleteStory,
    getStoryById,
  };
}; 