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
  const { user } = useClerkAuth();
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
      
      // Fetch stories
      const storiesResponse = await fetch('/api/stories', {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`,
        },
      });
      
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        setStories(storiesData.stories || []);
      }

      // Fetch ebooks
      const ebooksResponse = await fetch('/api/ebooks', {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`,
        },
      });
      
      if (ebooksResponse.ok) {
        const ebooksData = await ebooksResponse.json();
        setEbooks(ebooksData.ebooks || []);
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
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`,
        },
      });

      if (response.ok) {
        setStories(stories.filter(story => story.id !== storyId));
        toast({
          title: "Story deleted",
          description: "Your story has been successfully deleted.",
        });
      }
    } catch (error) {
      toast({
        title: "Error deleting story",
        description: "Failed to delete the story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEbook = async (ebookId: string) => {
    try {
      const response = await fetch(`/api/ebooks/${ebookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`,
        },
      });

      if (response.ok) {
        setEbooks(ebooks.filter(ebook => ebook.id !== ebookId));
        toast({
          title: "Ebook deleted",
          description: "Your ebook has been successfully deleted.",
        });
      }
    } catch (error) {
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
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(story.created_at)}
                                </div>
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
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(ebook.created_at)}
                                </div>
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