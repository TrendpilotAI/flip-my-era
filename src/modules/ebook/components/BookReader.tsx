import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { 
  BookOpen,
  ChevronLeft, 
  ChevronRight,
  Settings,
  Bookmark,
  Share2,
  Download,
  Volume2,
  Pause,
  Play,
  Moon,
  Sun,
  Eye,
  Type,
  Clock,
  Heart,
  Star,
  Music,
  Sparkles,
  Home,
  Menu
} from "lucide-react";
import { cn } from '@/core/lib/utils';
import { BookPageView } from "./BookPageView";
import { BookNavigation } from "./BookNavigation";
import { ReadingPreferences } from "./ReadingPreferences";
import { BookmarkManager } from "./BookmarkManager";
import { ReadingProgress } from "./ReadingProgress";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { DownloadShareModal } from '@/modules/shared/components/DownloadShareModal';

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

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

interface ReadingPrefs {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  darkMode: boolean;
  pageTransition: 'slide' | 'fade' | 'none';
  textToSpeech: boolean;
  autoBookmark: boolean;
}

interface ReadingState {
  currentChapter: number;
  currentPage: number;
  totalPages: number;
  readingTime: number;
  wordsRead: number;
  bookmarks: Array<{
    chapter: number;
    page: number;
    note?: string;
    timestamp: number;
  }>;
  lastReadPosition: number;
}

interface BookReaderProps {
  chapters: Chapter[];
  useTaylorSwiftThemes?: boolean;
  onClose?: () => void;
  initialChapter?: number;
  designSettings?: EbookDesignSettings;
}

export const BookReader = ({ 
  chapters, 
  useTaylorSwiftThemes = true, 
  onClose,
  initialChapter = 0,
  designSettings
}: BookReaderProps) => {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const readingTimerRef = useRef<number | null>(null);

  // Reading state
  const [readingState, setReadingState] = useState<ReadingState>({
    currentChapter: initialChapter,
    currentPage: 0,
    totalPages: 0,
    readingTime: 0,
    wordsRead: 0,
    bookmarks: [],
    lastReadPosition: 0
  });

  // Convert design settings to reading preferences
  const convertDesignToPreferences = (design?: EbookDesignSettings): ReadingPrefs => {
    if (!design) {
      return {
        fontSize: 'medium',
        fontFamily: 'serif',
        lineHeight: 'normal',
        darkMode: false,
        pageTransition: 'slide',
        textToSpeech: false,
        autoBookmark: true
      };
    }

    // Convert font size from px to preference
    let fontSize: 'small' | 'medium' | 'large' | 'xl' = 'medium';
    if (design.fontSize <= 14) fontSize = 'small';
    else if (design.fontSize <= 16) fontSize = 'medium';
    else if (design.fontSize <= 18) fontSize = 'large';
    else fontSize = 'xl';

    // Convert font family
    let fontFamily: 'serif' | 'sans' | 'mono' = 'serif';
    if (design.fontFamily === 'sans-serif') fontFamily = 'sans';
    else if (design.fontFamily === 'monospace') fontFamily = 'mono';

    // Convert line height
    let lineHeight: 'tight' | 'normal' | 'relaxed' = 'normal';
    if (design.lineHeight <= 1.3) lineHeight = 'tight';
    else if (design.lineHeight >= 1.7) lineHeight = 'relaxed';

    return {
      fontSize,
      fontFamily,
      lineHeight,
      darkMode: false,
      pageTransition: 'slide',
      textToSpeech: false,
      autoBookmark: true
    };
  };

  // Reading preferences - initialized from design settings
  const [preferences, setPreferences] = useState<ReadingPrefs>(() => 
    convertDesignToPreferences(designSettings)
  );

  // Update preferences when design settings change
  useEffect(() => {
    if (designSettings) {
      setPreferences(convertDesignToPreferences(designSettings));
    }
  }, [designSettings]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Load saved preferences and reading state
  useEffect(() => {
    // Only load saved preferences if no design settings are provided
    if (!designSettings) {
      const savedPrefs = localStorage.getItem('book-reader-preferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }

    const savedState = localStorage.getItem('book-reader-state');
    if (savedState) {
      const state = JSON.parse(savedState);
      setReadingState(prev => ({ ...prev, ...state }));
    }
  }, [designSettings]);

  // Save preferences and state
  useEffect(() => {
    // Only save preferences if not using design settings
    if (!designSettings) {
      localStorage.setItem('book-reader-preferences', JSON.stringify(preferences));
    }
  }, [preferences, designSettings]);

  useEffect(() => {
    localStorage.setItem('book-reader-state', JSON.stringify(readingState));
  }, [readingState]);

  // Reading timer
  useEffect(() => {
    if (isReading) {
      readingTimerRef.current = window.setInterval(() => {
        setReadingState(prev => ({
          ...prev,
          readingTime: prev.readingTime + 1
        }));
      }, 1000);
    } else {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
    }

    return () => {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
    };
  }, [isReading]);

  // Auto-bookmark on chapter change
  useEffect(() => {
    if (preferences.autoBookmark) {
      const bookmark = {
        chapter: readingState.currentChapter,
        page: readingState.currentPage,
        timestamp: Date.now()
      };
      
      setReadingState(prev => ({
        ...prev,
        bookmarks: [bookmark, ...prev.bookmarks.slice(0, 9)] // Keep last 10 bookmarks
      }));
    }
  }, [readingState.currentChapter, preferences.autoBookmark]);

  const currentChapter = chapters[readingState.currentChapter];

  const handleChapterChange = (chapterIndex: number) => {
    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      setReadingState(prev => ({
        ...prev,
        currentChapter: chapterIndex,
        currentPage: 0
      }));
      setIsReading(true);
    }
  };

  const handlePageChange = (pageIndex: number) => {
    setReadingState(prev => ({
      ...prev,
      currentPage: pageIndex
    }));
  };

  const handleNextChapter = () => {
    if (readingState.currentChapter < chapters.length - 1) {
      handleChapterChange(readingState.currentChapter + 1);
    }
  };

  const handlePrevChapter = () => {
    if (readingState.currentChapter > 0) {
      handleChapterChange(readingState.currentChapter - 1);
    }
  };

  const handleBookmark = () => {
    const bookmark = {
      chapter: readingState.currentChapter,
      page: readingState.currentPage,
      timestamp: Date.now(),
      note: `Chapter ${readingState.currentChapter + 1}: ${currentChapter?.title}`
    };

    setReadingState(prev => ({
      ...prev,
      bookmarks: [bookmark, ...prev.bookmarks]
    }));

    toast({
      title: "Bookmark Added",
      description: `Bookmarked Chapter ${readingState.currentChapter + 1}`,
    });
  };

  const handleTextToSpeech = () => {
    if (!speechSynthesis || !currentChapter) return;

    if (preferences.textToSpeech) {
      speechSynthesis.cancel();
      setPreferences(prev => ({ ...prev, textToSpeech: false }));
    } else {
      const utterance = new SpeechSynthesisUtterance(currentChapter.content);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
      setPreferences(prev => ({ ...prev, textToSpeech: true }));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getDesignStyles = (): React.CSSProperties => {
    if (!designSettings) return {};
    
    return {
      fontFamily: designSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                  designSettings.fontFamily === 'sans-serif' ? 'Arial, sans-serif' : 
                  'Monaco, monospace',
      fontSize: `${designSettings.fontSize}px`,
      lineHeight: designSettings.lineHeight,
      letterSpacing: `${designSettings.letterSpacing}em`,
      textAlign: designSettings.textAlignment as any,
      marginTop: `${designSettings.marginTop}px`,
      marginBottom: `${designSettings.marginBottom}px`,
      marginLeft: `${designSettings.marginLeft}px`,
      marginRight: `${designSettings.marginRight}px`,
    };
  };

  const getColorSchemeColors = (scheme?: string) => {
    if (!scheme) return { primary: '#8B5CF6', secondary: '#EC4899' };
    
    switch (scheme) {
      case 'purple-pink':
        return { primary: '#8B5CF6', secondary: '#EC4899' };
      case 'blue-green':
        return { primary: '#3B82F6', secondary: '#10B981' };
      case 'orange-red':
        return { primary: '#F97316', secondary: '#EF4444' };
      case 'monochrome':
        return { primary: '#374151', secondary: '#6B7280' };
      default:
        return { primary: '#8B5CF6', secondary: '#EC4899' };
    }
  };

  const formatReadingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const estimateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center space-y-4">
          <BookOpen className="h-16 w-16 mx-auto text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-600">No Chapters Available</h2>
          <p className="text-gray-500">This book doesn't have any chapters to read.</p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-gradient-to-br transition-all duration-300",
      preferences.darkMode 
        ? "from-gray-900 to-black text-white" 
        : "from-gray-50 to-white text-gray-900"
    )}>
      {/* Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b transition-all duration-300",
        preferences.darkMode 
          ? "bg-black/20 border-white/10" 
          : "bg-white/80 border-gray-200",
        showNavigation && "ml-80",
        (showBookmarks || showSettings) && "mr-80"
      )}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">Chapter {readingState.currentChapter + 1}</h1>
              <p className="text-sm opacity-70">{currentChapter?.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ReadingProgress
              currentChapter={readingState.currentChapter}
              totalChapters={chapters.length}
              readingTime={readingState.readingTime}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleTextToSpeech}
              className={preferences.textToSpeech ? "bg-blue-100 text-blue-600" : ""}
            >
              {preferences.textToSpeech ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <Home className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      {showNavigation && (
        <BookNavigation
          chapters={chapters}
          currentChapter={readingState.currentChapter}
          onChapterSelect={handleChapterChange}
          onClose={() => setShowNavigation(false)}
          useTaylorSwiftThemes={useTaylorSwiftThemes}
        />
      )}

      {/* Settings Sidebar */}
      {showSettings && (
        <ReadingPreferences
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onClose={() => setShowSettings(false)}
          designSettings={designSettings}
        />
      )}

      {/* Bookmarks Sidebar */}
      {showBookmarks && (
        <BookmarkManager
          bookmarks={readingState.bookmarks}
          onBookmarkSelect={(bookmark) => {
            handleChapterChange(bookmark.chapter);
            handlePageChange(bookmark.page);
            setShowBookmarks(false);
          }}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {/* Main Content */}
      <div className="pt-20 pb-16 h-full overflow-hidden">
        <div className={cn(
          "transition-all duration-300 h-full",
          showNavigation && "ml-80",
          (showBookmarks || showSettings) && "mr-80"
        )}>
          {/* Enhanced Book Page View with Design Settings */}
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8" style={getDesignStyles()}>
              {/* Chapter Title */}
              <div className="text-center mb-8">
                <h1 className="font-bold mb-4" style={{
                  fontSize: designSettings ? `${designSettings.chapterTitleSize}px` : '2.5rem',
                  color: designSettings?.chapterHeadingColor || '#8B5CF6',
                  marginBottom: designSettings ? `${designSettings.chapterSpacing}px` : '2rem'
                }}>
                  {currentChapter?.title}
                </h1>
                
                {/* Reading info */}
                <div className="flex items-center justify-center space-x-4 text-sm opacity-70">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {estimateReadingTime(currentChapter?.content || '')} min read
                  </span>
                  <span>•</span>
                  <span>Chapter {readingState.currentChapter + 1} of {chapters.length}</span>
                </div>
              </div>

              {/* Chapter Content */}
              <div className="prose max-w-none">
                {currentChapter?.content.split('\n\n').map((paragraph, index) => (
                  <p 
                    key={index} 
                    className="leading-relaxed"
                    style={{
                      marginBottom: designSettings ? `${designSettings.paragraphSpacing}px` : '1.5rem',
                      textIndent: designSettings?.textAlignment === 'justify' ? '1.5em' : '0',
                      color: designSettings?.textColor || '#374151'
                    }}
                  >
                    {paragraph.startsWith('"') ? (
                      <span className="italic font-medium" style={{
                        color: getColorSchemeColors(designSettings?.colorScheme).secondary
                      }}>
                        {paragraph}
                      </span>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>

              {/* Chapter Image */}
              {currentChapter?.imageUrl && (
                <div className="mt-8 text-center">
                  <img
                    src={currentChapter.imageUrl}
                    alt={`Illustration for ${currentChapter.title}`}
                    className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  />
                </div>
              )}

              {/* Chapter End Decoration */}
              <div className="text-center mt-12 mb-8">
                <div className="inline-flex items-center space-x-2">
                  {useTaylorSwiftThemes ? (
                    <>
                      <Star className="h-4 w-4 opacity-50" style={{
                        color: getColorSchemeColors(designSettings?.colorScheme).primary
                      }} />
                      <Heart className="h-4 w-4 opacity-50" style={{
                        color: getColorSchemeColors(designSettings?.colorScheme).secondary
                      }} />
                      <Star className="h-4 w-4 opacity-50" style={{
                        color: getColorSchemeColors(designSettings?.colorScheme).primary
                      }} />
                    </>
                  ) : (
                    <div className="w-12 h-px opacity-30" style={{
                      backgroundColor: getColorSchemeColors(designSettings?.colorScheme).primary
                    }}></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t transition-all duration-300",
        preferences.darkMode 
          ? "bg-black/20 border-white/10" 
          : "bg-white/80 border-gray-200",
        showNavigation && "ml-80",
        (showBookmarks || showSettings) && "mr-80"
      )}>
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            onClick={handlePrevChapter}
            disabled={readingState.currentChapter === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {chapters.map((_, index) => (
              <button
                key={index}
                onClick={() => handleChapterChange(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === readingState.currentChapter
                    ? "w-8 opacity-100"
                    : "opacity-40 hover:opacity-70"
                )}
                style={{
                  backgroundColor: getColorSchemeColors(designSettings?.colorScheme).primary
                }}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={handleNextChapter}
            disabled={readingState.currentChapter === chapters.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};