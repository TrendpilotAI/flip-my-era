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
  Zap,
  MoreHorizontal
} from "lucide-react";
import { cn } from '@/core/lib/utils';
import { DownloadShareModal } from '@/modules/shared/components/DownloadShareModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/shared/components/ui/dropdown-menu';
import { BookReader } from './BookReader';

interface EbookDesignSettings {
  // Typography
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  fontSize: number; // 12-20px
  lineHeight: number; // 1.2-2.0
  letterSpacing: number; // -0.05 to 0.1em
  textColor: string; // Custom text color in hex format
  chapterHeadingColor: string; // Custom chapter heading color in hex format
  
  // Layout
  pageLayout: 'single' | 'double' | 'magazine';
  textAlignment: 'left' | 'center' | 'justify';
  marginTop: number; // 20-60px
  marginBottom: number; // 20-60px
  marginLeft: number; // 20-80px
  marginRight: number; // 20-80px
  
  // Cover Design
  coverStyle: 'minimal' | 'modern' | 'classic' | 'bold';
  colorScheme: 'purple-pink' | 'blue-green' | 'orange-red' | 'monochrome';
  
  // Chapter Settings
  chapterTitleSize: number; // 24-36px
  chapterSpacing: number; // 30-60px
  paragraphSpacing: number; // 12-24px
}

interface MemoryBook {
  id: string;
  title: string;
  description: string;
  chapters: any[] | string | object; // Can be array, JSON string, or object
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
  // Additional fields for ebook_generations fallback
  content?: any; // This might contain design settings
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
  const [selectedBook, setSelectedBook] = useState<MemoryBook | null>(null);
  const [showDownloadShareModal, setShowDownloadShareModal] = useState(false);
  const [showBookReader, setShowBookReader] = useState(false);
  const [selectedBookForReading, setSelectedBookForReading] = useState<MemoryBook | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserBooks();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Lock background scroll when BookReader is open
  useEffect(() => {
    if (showBookReader) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBookReader]);

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
      
      // Try to fetch from memory_books first (newer table for user books)
      let { data, error } = await supabaseWithAuth
        .from('memory_books')
        .select('*')
        .order('created_at', { ascending: false });

      // If memory_books is empty or doesn't exist, fallback to ebook_generations
      if (!data || data.length === 0) {
        console.log('No books found in memory_books, trying ebook_generations...');
        const fallbackResult = await supabaseWithAuth
          .from('ebook_generations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackResult.data && fallbackResult.data.length > 0) {
          // Map ebook_generations data to memory_books format
          data = fallbackResult.data.map(book => ({
            ...book,
            chapters: book.content, // content field maps to chapters
            description: book.title || 'Generated ebook',
            status: book.status || 'completed',
            generation_settings: {},
            style_preferences: {},
            view_count: 0,
            download_count: 0,
            share_count: 0,
            rating_average: 0,
            rating_count: 0,
            content: book.content // Keep original content for design settings extraction
          }));
          error = fallbackResult.error;
        }
      }

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

  const parseChapters = (chapters: any[] | string | object): any[] => {
    try {
      if (typeof chapters === 'string') {
        const parsed = JSON.parse(chapters);
        // Check if it's the new format with chapters and designSettings
        if (parsed && typeof parsed === 'object' && parsed.chapters) {
          return parsed.chapters;
        }
        return parsed;
      } else if (Array.isArray(chapters)) {
        return chapters;
      } else if (chapters && typeof chapters === 'object') {
        // Check if it's the new format with chapters and designSettings
        if ((chapters as any).chapters) {
          return (chapters as any).chapters;
        }
        return (chapters as any).chapters || Object.values(chapters);
      }
      return [];
    } catch (error) {
      console.error('Error parsing chapters:', error);
      return [];
    }
  };

  const extractDesignSettings = (book: MemoryBook): EbookDesignSettings | undefined => {
    try {
      // Try to extract from content field (ebook_generations format)
      if (book.content) {
        let contentData;
        if (typeof book.content === 'string') {
          contentData = JSON.parse(book.content);
        } else {
          contentData = book.content;
        }
        
        if (contentData && contentData.designSettings) {
          return contentData.designSettings;
        }
      }
      
      // Try to extract from chapters field (might also contain design settings)
      if (book.chapters) {
        let chaptersData;
        if (typeof book.chapters === 'string') {
          chaptersData = JSON.parse(book.chapters);
        } else {
          chaptersData = book.chapters;
        }
        
        if (chaptersData && typeof chaptersData === 'object' && chaptersData.designSettings) {
          return chaptersData.designSettings;
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting design settings:', error);
      return undefined;
    }
  };

  const handleDownloadShare = (book: MemoryBook, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedBook(book);
    setShowDownloadShareModal(true);
  };

  const handleBookClick = (book: MemoryBook) => {
    console.log('Book clicked:', book.title);
    console.log('Raw chapters data:', book.chapters);
    
    // Parse chapters data using the helper function
    const chapters = parseChapters(book.chapters);
    console.log('Parsed chapters:', chapters);

    // Check if the book has chapters to read
    if (!chapters || chapters.length === 0) {
      console.log('No chapters found for book:', book.title);
      toast({
        title: "Book Not Ready",
        description: "This book doesn't have any chapters to read yet. Try generating chapters first.",
        variant: "destructive",
      });
      return;
    }

    // Validate chapter structure
    const validChapters = chapters.filter(chapter => 
      chapter && typeof chapter === 'object' && (chapter.title || chapter.content)
    );

    if (validChapters.length === 0) {
      toast({
        title: "Invalid Book Data",
        description: "This book's chapters are not properly formatted. Please regenerate the book.",
        variant: "destructive",
      });
      return;
    }

    setSelectedBookForReading({
      ...book,
      chapters: validChapters
    });
    setShowBookReader(true);
    
    // Call the optional callback if provided
    onBookSelect?.(book);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'generating':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Generating</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getThemeIcon = (theme?: string) => {
    if (!theme) return <Star className="h-4 w-4 text-yellow-500" />;
    
    switch (theme) {
      case 'folklore':
        return <Heart className="h-4 w-4 text-green-500" />;
      case 'lover':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case '1989':
        return <Star className="h-4 w-4 text-blue-500" />;
      case 'reputation':
        return <Zap className="h-4 w-4 text-gray-800" />;
      default:
        return <Star className="h-4 w-4 text-purple-500" />;
    }
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
            onClick={() => handleBookClick(book)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {book.generation_settings?.useTaylorSwiftThemes && 
                    getThemeIcon(book.generation_settings.selectedTheme)}
                  <BookOpen className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(book.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleDownloadShare(book, e)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDownloadShare(book, e)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

              <div className="flex items-center justify-between">
                {book.generation_settings?.useTaylorSwiftThemes && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-purple-600 font-medium">
                      Taylor Swift Theme
                    </span>
                  </div>
                )}
                
                {/* Reading Status Indicator */}
                <div className="flex items-center space-x-1 text-xs">
                  {book.chapters && (
                    Array.isArray(book.chapters) ? book.chapters.length > 0 : true
                  ) ? (
                    <>
                      <BookOpen className="h-3 w-3 text-green-500" />
                      <span className="text-green-600 font-medium">Ready to Read</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">Not Ready</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download & Share Modal */}
      {selectedBook && (
        <DownloadShareModal
          isOpen={showDownloadShareModal}
          onClose={() => {
            setShowDownloadShareModal(false);
            setSelectedBook(null);
          }}
          content={{
            id: selectedBook.id,
            title: selectedBook.title,
            content: parseChapters(selectedBook.chapters),
            type: 'ebook',
            author: 'FlipMyEra User'
          }}
        />
      )}

      {/* Book Reader */}
      {showBookReader && selectedBookForReading && selectedBookForReading.chapters && (
        <div className="fixed inset-0 z-50">
          <BookReader
            chapters={parseChapters(selectedBookForReading.chapters)}
            useTaylorSwiftThemes={selectedBookForReading.generation_settings?.useTaylorSwiftThemes}
            designSettings={extractDesignSettings(selectedBookForReading)}
            onClose={() => {
              setShowBookReader(false);
              setSelectedBookForReading(null);
            }}
            initialChapter={0}
          />
        </div>
      )}
    </div>
  );
}; 