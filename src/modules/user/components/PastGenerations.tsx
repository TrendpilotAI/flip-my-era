import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { Badge } from '@/modules/shared/components/ui/badge';
import { 
  ArrowLeft, 
  BookOpen, 
  BookText, 
  Calendar, 
  Clock, 
  Download,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';

interface Story {
  id: string;
  title: string;
  content: string;
  created_at: string;
  personality_type?: string;
  location?: string;
}

interface Ebook {
  id: string;
  title: string;
  chapters: any[];
  created_at: string;
  theme?: string;
}

const PastGenerations = () => {
  const { user, getToken } = useClerkAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stories');
  const [stories, setStories] = useState<Story[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastGenerations();
  }, []);

  const fetchPastGenerations = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      // Get Clerk token for authentication
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        console.warn('No Clerk token available');
        setLoading(false);
        return;
      }

      // Create authenticated Supabase client
      const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
      
      // Fetch stories from Supabase
      const { data: storiesData, error: storiesError } = await supabaseWithAuth
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
      } else {
        // Map stories data to match our interface
        const mappedStories = storiesData?.map(story => ({
          id: story.id,
          title: story.title || story.name || 'Untitled Story',
          content: story.initial_story || story.content || '',
          created_at: story.created_at,
          personality_type: story.personality_type,
          location: story.location
        })) || [];
        setStories(mappedStories);
      }

      // Fetch ebooks from Supabase - try ebook_generations first
      const { data: ebookGenerationsData, error: ebookGenerationsError } = await supabaseWithAuth
        .from('ebook_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ebookGenerationsError) {
        console.error('Error fetching ebooks:', ebookGenerationsError);
      } else {
        // Map ebook_generations data to match our interface
        const mappedEbooks = ebookGenerationsData?.map(book => ({
          id: book.id,
          title: book.title || 'Generated Ebook',
          chapters: book.chapters || [], // Use chapters field directly
          content: book.content || '',
          created_at: book.created_at,
          theme: book.style_preferences?.theme || 'default',
          style_preferences: book.style_preferences || {}
        })) || [];
        setEbooks(mappedEbooks);
      }

    } catch (error) {
      console.error('Error fetching past generations:', error);
      toast({
        title: "Error loading past generations",
        description: "Failed to load your previous stories and ebooks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewStory = (story: Story) => {
    // Navigate to story view or open in modal
    navigate(`/story/${story.id}`);
  };

  const handleViewEbook = (ebook: Ebook) => {
    // Navigate to ebook reader
    navigate(`/ebook/${ebook.id}`);
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        toast({
          title: "Authentication error",
          description: "Please sign in again to delete stories.",
          variant: "destructive",
        });
        return;
      }

      const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
      
      const { error } = await supabaseWithAuth
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setStories(stories.filter(story => story.id !== storyId));
      toast({
        title: "Story deleted",
        description: "Your story has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error deleting story",
        description: "Failed to delete the story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEbook = async (ebookId: string) => {
    try {
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        toast({
          title: "Authentication error",
          description: "Please sign in again to delete ebooks.",
          variant: "destructive",
        });
        return;
      }

      const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
      
      // Try to delete from memory_books first
      let { error } = await supabaseWithAuth
        .from('memory_books')
        .delete()
        .eq('id', ebookId)
        .eq('user_id', user?.id);

      // If that fails, try ebook_generations
      if (error) {
        const { error: ebookError } = await supabaseWithAuth
          .from('ebook_generations')
          .delete()
          .eq('id', ebookId)
          .eq('user_id', user?.id);
        
        if (ebookError) {
          throw ebookError;
        }
      }

      setEbooks(ebooks.filter(ebook => ebook.id !== ebookId));
      toast({
        title: "Ebook deleted",
        description: "Your ebook has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting ebook:', error);
      toast({
        title: "Error deleting ebook",
        description: "Failed to delete the ebook. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/20"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Past Generations</h1>
            <p className="text-white/90">View and manage your previous stories and ebooks</p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Your Creations</CardTitle>
            <CardDescription>
              Browse through your previously generated stories and ebooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stories" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Stories ({stories.length})
                </TabsTrigger>
                <TabsTrigger value="ebooks" className="flex items-center gap-2">
                  <BookText className="h-4 w-4" />
                  Ebooks ({ebooks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stories" className="mt-6">
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
                      <Card key={story.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                              <CardDescription className="mt-2">
                                <span className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(story.created_at)}
                                </span>
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewStory(story)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStory(story.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {story.content.substring(0, 150)}...
                          </p>
                          {story.personality_type && (
                            <Badge variant="secondary" className="mt-2">
                              {story.personality_type}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ebooks" className="mt-6">
                {ebooks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No ebooks yet</h3>
                    <p className="text-gray-500 mb-4">Start creating your memory books!</p>
                    <Button
                      onClick={() => navigate('/ebook-builder')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      Create Your First Ebook
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ebooks.map((ebook) => (
                      <Card key={ebook.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">{ebook.title}</CardTitle>
                              <CardDescription className="mt-2">
                                <span className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(ebook.created_at)}
                                </span>
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewEbook(ebook)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEbook(ebook.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            {ebook.chapters?.length || 0} chapters
                          </p>
                          {ebook.theme && (
                            <Badge variant="secondary" className="mt-2">
                              {ebook.theme}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PastGenerations; 