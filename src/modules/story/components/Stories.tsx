
import { useState, useEffect } from "react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { getUserStories } from '@/modules/story/utils/storyPersistence';
import { Loader2, BookOpen, Calendar, UserCircle } from "lucide-react";
import { Button } from '@/modules/shared/components/ui/button';
import { useNavigate } from "react-router-dom";
// Remove ReactMarkdown import
import ReactMarkdown from "react-markdown";

interface Story {
  id: string;
  title: string;
  name: string;
  birth_date: string | null;
  initial_story: string;
  created_at: string;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      const storiesData = await getUserStories(token);
      setStories(storiesData || []);
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
          <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Story Gallery</h1>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-white"
          >
            Create New Story
          </Button>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No stories yet</h3>
            <p className="text-gray-500 mb-4">Start creating your alternate life stories!</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              Create Your First Story
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                    {story.title || "Untitled Story"}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <UserCircle className="h-4 w-4 mr-1" />
                    <span>{story.name}</span>
                    {story.birth_date && (
                      <>
                        <Calendar className="h-4 w-4 ml-3 mr-1" />
                        <span>{new Date(story.birth_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {/* Replace ReactMarkdown with plain text */}
                  <div className="prose prose-sm line-clamp-3 mb-4 text-gray-600">
                    {story.initial_story.substring(0, 150)}...
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500">
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/story/${story.id}`)}
                      className="ml-2"
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
