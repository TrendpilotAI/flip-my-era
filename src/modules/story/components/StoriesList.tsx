
import { useState, useEffect } from "react";
import { Button } from '@/modules/shared/components/ui/button';
import { ScrollArea } from '@/modules/shared/components/ui/scroll-area';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Loader2 } from "lucide-react";
import { supabase } from '@/core/integrations/supabase/client';

interface Story {
  id: string;
  title: string;
  initial_story: string;
  created_at: string;
}

interface StoriesListProps {
  onStorySelect: (story: Story) => void;
}

export const StoriesList = ({ onStorySelect }: StoriesListProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading stories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="text-center p-4 text-gray-500">
        No stories saved yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
      <div className="space-y-2">
        {stories.map((story) => (
          <Button
            key={story.id}
            variant="outline"
            className="w-full justify-start text-left"
            onClick={() => onStorySelect(story)}
          >
            <div>
              <div className="font-medium">{story.title || 'Untitled Story'}</div>
              <div className="text-sm text-gray-500 truncate">
                {new Date(story.created_at).toLocaleDateString()}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};
