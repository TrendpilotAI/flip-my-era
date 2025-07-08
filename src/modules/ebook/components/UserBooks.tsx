import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { supabase, createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Eye, 
  Download, 
  Share2, 
  Star,
  Loader2,
  Plus,
  Sparkles,
  Heart,
  Users,
  Zap
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface MemoryBook {
  id: string;
  title: string;
  description: string;
  chapters: any[];
  chapter_count: number;
  word_count: number;
  status: string;
  created_at: string;
  generation_settings: {
    useTaylorSwiftThemes?: boolean;
    selectedTheme?: string;
    selectedFormat?: string;
    storyType?: string;
  };
  style_preferences: {
    image_style?: string;
    mood?: string;
    target_age_group?: string;
  };
  view_count: number;
  download_count: number;
  share_count: number;
  rating_average: number;
  rating_count: number;
}

interface UserBooksProps {
  className?: string;
  onBookSelect?: (book: MemoryBook) => void;
}

export const UserBooks = ({ className, onBookSelect }: UserBooksProps) => {
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<MemoryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserBooks();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const fetchUserBooks = async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('No token available for database operation');
        setError('Authentication required');
        return;
      }
      
      // Create authenticated Supabase client
      const supabaseWithAuth = createSupabaseClientWithClerkToken(token);
      
      const { data, error } = await supabaseWithAuth
        .from('ebook_generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books:', error);
        setError('Failed to load your books');
        toast({
          title: "Error",
          description: "Failed to load your books. Please try again.",
          variant: "destructive",
        });
      } else {
        setBooks(data || []);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load your books');
      toast({
        title: "Error",
        description: "Failed to load your books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getThemeIcon = (theme?: string) => {
    switch (theme) {
      case 'coming-of-age':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'first-love':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'heartbreak':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'friendship':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      generating: { label: 'Generating', variant: 'default' as const },
      processing: { label: 'Processing', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      published: { label: 'Published', variant: 'default' as const },
      archived: { label: 'Archived', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!isSignedIn) {
    return (
      <Card className={cn("text-center py-8", className)}>
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view your books</h3>
          <p className="text-gray-500">Your generated books will appear here once you sign in.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn("text-center py-8", className)}>
        <CardContent>
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">Loading your books...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("text-center py-8", className)}>
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading books</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchUserBooks} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (books.length === 0) {
    return (
      <Card className={cn("text-center py-8", className)}>
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
          <p className="text-gray-500 mb-4">Start creating your first illustrated story!</p>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Book
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
        <Badge variant="outline">{books.length} books</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Card 
            key={book.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onBookSelect?.(book)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {book.generation_settings?.useTaylorSwiftThemes && 
                    getThemeIcon(book.generation_settings.selectedTheme)}
                  <BookOpen className="h-4 w-4 text-gray-500" />
                </div>
                {getStatusBadge(book.status)}
              </div>
              <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {book.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(book.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{book.chapter_count} chapters</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{book.view_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>{book.download_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share2 className="h-3 w-3" />
                    <span>{book.share_count}</span>
                  </div>
                </div>
                {book.rating_average > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{book.rating_average.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {book.generation_settings?.useTaylorSwiftThemes && (
                <div className="flex items-center space-x-2 text-xs">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  <span className="text-purple-600 font-medium">
                    Taylor Swift Theme
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 