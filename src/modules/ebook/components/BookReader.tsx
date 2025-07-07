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

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface ReadingState {
  currentChapter: number;
  currentPage: number;
  totalPages: number;
  readingTime: number;
  wordsRead: number;
  bookmarks: Bookmark[];
  lastReadPosition: number;
}

interface Bookmark {
  id: string;
  chapterIndex: number;
  pageIndex: number;
  position: number;
  note?: string;
  timestamp: Date;
}

interface ReadingPrefs {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  darkMode: boolean;
  pageTransition: 'slide' | 'fade' | 'flip';
  textToSpeech: boolean;
  autoBookmark: boolean;
}

interface BookReaderProps {
  chapters: Chapter[];
  useTaylorSwiftThemes?: boolean;
  onClose?: () => void;
  initialChapter?: number;
}

export const BookReader = ({ 
  chapters, 
  useTaylorSwiftThemes = true, 
  onClose,
  initialChapter = 0
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

  // Reading preferences
  const [preferences, setPreferences] = useState<ReadingPrefs>({
    fontSize: 'medium',
    fontFamily: 'serif',
    lineHeight: 'normal',
    darkMode: false,
    pageTransition: 'slide',
    textToSpeech: false,
    autoBookmark: true
  });

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Load saved preferences and reading state
  useEffect(() => {
    const savedPrefs = localStorage.getItem('book-reader-preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    const savedState = localStorage.getItem('book-reader-state');
    if (savedState) {
      const state = JSON.parse(savedState);
      setReadingState(prev => ({ ...prev, ...state }));
    }
  }, []);

  // Save preferences and state
  useEffect(() => {
    localStorage.setItem('book-reader-preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('book-reader-state', JSON.stringify(readingState));
  }, [readingState]);

  // Reading timer
  useEffect(() => {
    if (isReading) {
      readingTimerRef.current = setInterval(() => {
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
      const autoBookmark: Bookmark = {
        id: `auto-${Date.now()}`,
        chapterIndex: readingState.currentChapter,
        pageIndex: readingState.currentPage,
        position: 0,
        note: 'Auto-bookmark',
        timestamp: new Date()
      };
      
      setReadingState(prev => ({
        ...prev,
        bookmarks: [autoBookmark, ...prev.bookmarks.slice(0, 9)] // Keep last 10 bookmarks
      }));
    }
  }, [readingState.currentChapter, readingState.currentPage, preferences.autoBookmark]);

  const handleChapterChange = useCallback((chapterIndex: number) => {
    setReadingState(prev => ({
      ...prev,
      currentChapter: chapterIndex,
      currentPage: 0
    }));
    setShowNavigation(false);
  }, []);

  const handlePageChange = useCallback((pageIndex: number) => {
    setReadingState(prev => ({
      ...prev,
      currentPage: pageIndex
    }));
  }, []);

  const handleBookmark = useCallback((note?: string) => {
    const bookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      chapterIndex: readingState.currentChapter,
      pageIndex: readingState.currentPage,
      position: 0,
      note: note || `Chapter ${readingState.currentChapter + 1}`,
      timestamp: new Date()
    };

    setReadingState(prev => ({
      ...prev,
      bookmarks: [bookmark, ...prev.bookmarks]
    }));

    toast({
      title: "Bookmark Added",
      description: `Added bookmark for ${bookmark.note}`,
    });
  }, [readingState.currentChapter, readingState.currentPage, toast]);

  const handleTextToSpeech = useCallback(() => {
    if (!speechSynthesis) return;

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const currentChapter = chapters[readingState.currentChapter];
    if (!currentChapter) return;

    const utterance = new SpeechSynthesisUtterance(currentChapter.content);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => {
      setIsReading(false);
      toast({
        title: "Speech Error",
        description: "Unable to read text aloud",
        variant: "destructive",
      });
    };

    speechSynthesis.speak(utterance);
  }, [speechSynthesis, chapters, readingState.currentChapter, toast]);

  const nextChapter = useCallback(() => {
    if (readingState.currentChapter < chapters.length - 1) {
      handleChapterChange(readingState.currentChapter + 1);
    }
  }, [readingState.currentChapter, chapters.length, handleChapterChange]);

  const previousChapter = useCallback(() => {
    if (readingState.currentChapter > 0) {
      handleChapterChange(readingState.currentChapter - 1);
    }
  }, [readingState.currentChapter, handleChapterChange]);

  const handleShare = useCallback(() => {
    const currentChapter = chapters[readingState.currentChapter];
    if (navigator.share && currentChapter) {
      navigator.share({
        title: currentChapter.title,
        text: `Reading "${currentChapter.title}" - A beautiful ${useTaylorSwiftThemes ? 'Taylor Swift-inspired' : ''} story`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      const shareText = `Reading "${currentChapter?.title}" - A beautiful story`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Share text copied to clipboard",
      });
    }
  }, [chapters, readingState.currentChapter, useTaylorSwiftThemes, toast]);

  const handleDownload = useCallback(() => {
    // Generate a text file download
    const content = chapters.map(chapter => 
      `# ${chapter.title}\n\n${chapter.content}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-${Date.now()}.txt`;
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chapters]);

  const currentChapter = chapters[readingState.currentChapter];
  const progress = ((readingState.currentChapter + 1) / chapters.length) * 100;

  const themeClasses = useTaylorSwiftThemes ? {
    background: preferences.darkMode 
      ? "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" 
      : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50",
    accent: "text-purple-600",
    border: "border-purple-200"
  } : {
    background: preferences.darkMode 
      ? "bg-gray-900" 
      : "bg-gray-50",
    accent: "text-blue-600",
    border: "border-blue-200"
  };

  return (
    <div className={cn(
      "min-h-screen transition-all duration-300",
      themeClasses.background,
      preferences.darkMode ? "text-white" : "text-gray-900"
    )}>
      {/* Top Navigation Bar */}
      <div className={cn(
        "sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300",
        preferences.darkMode 
          ? "bg-black/20 border-white/10" 
          : "bg-white/80 border-gray-200"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {useTaylorSwiftThemes && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <Heart className="h-4 w-4 text-pink-500" />
                <Music className="h-4 w-4 text-purple-500" />
              </div>
            )}
            <h1 className="text-lg font-bold truncate max-w-xs">
              {currentChapter?.title || "Book Reader"}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBookmark()}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <ReadingProgress
            currentChapter={readingState.currentChapter + 1}
            totalChapters={chapters.length}
            progress={progress}
            readingTime={readingState.readingTime}
            useTaylorSwiftThemes={useTaylorSwiftThemes}
            darkMode={preferences.darkMode}
          />
        </div>
      </div>

      {/* Reading Content */}
      <div className="relative">
        {/* Side Panels */}
        {showNavigation && (
          <div className="fixed left-0 top-16 bottom-0 w-80 z-30">
            <BookNavigation
              chapters={chapters}
              currentChapter={readingState.currentChapter}
              onChapterSelect={handleChapterChange}
              onClose={() => setShowNavigation(false)}
              useTaylorSwiftThemes={useTaylorSwiftThemes}
              darkMode={preferences.darkMode}
            />
          </div>
        )}

        {showBookmarks && (
          <div className="fixed right-0 top-16 bottom-0 w-80 z-30">
            <BookmarkManager
              bookmarks={readingState.bookmarks}
              chapters={chapters}
              onBookmarkSelect={(bookmark) => {
                handleChapterChange(bookmark.chapterIndex);
                setShowBookmarks(false);
              }}
              onBookmarkDelete={(bookmarkId) => {
                setReadingState(prev => ({
                  ...prev,
                  bookmarks: prev.bookmarks.filter(b => b.id !== bookmarkId)
                }));
              }}
              onClose={() => setShowBookmarks(false)}
              useTaylorSwiftThemes={useTaylorSwiftThemes}
              darkMode={preferences.darkMode}
            />
          </div>
        )}

        {showSettings && (
          <div className="fixed right-0 top-16 bottom-0 w-80 z-30">
            <ReadingPreferences
              preferences={preferences}
              onPreferencesChange={setPreferences}
              onClose={() => setShowSettings(false)}
              useTaylorSwiftThemes={useTaylorSwiftThemes}
            />
          </div>
        )}

        {/* Main Reading Area */}
        <div className={cn(
          "transition-all duration-300",
          showNavigation && "ml-80",
          (showBookmarks || showSettings) && "mr-80"
        )}>
          <BookPageView
            chapter={currentChapter}
            chapterIndex={readingState.currentChapter}
            preferences={preferences}
            useTaylorSwiftThemes={useTaylorSwiftThemes}
            onPageChange={handlePageChange}
          />
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
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousChapter}
              disabled={readingState.currentChapter === 0}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            
            <span className="text-sm px-2">
              {readingState.currentChapter + 1} of {chapters.length}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextChapter}
              disabled={readingState.currentChapter === chapters.length - 1}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {preferences.textToSpeech && speechSynthesis && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTextToSpeech}
                className={cn("transition-colors", themeClasses.accent)}
              >
                {isReading ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              className={cn("transition-colors", themeClasses.accent)}
            >
              {preferences.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className={cn("transition-colors", themeClasses.accent)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action for Speech */}
      {preferences.textToSpeech && (
        <div className="fixed bottom-20 right-6 z-50">
          <Button
            onClick={handleTextToSpeech}
            className={cn(
              "rounded-full w-12 h-12 shadow-lg transition-all duration-300",
              useTaylorSwiftThemes 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                : "bg-blue-500 hover:bg-blue-600",
              isReading && "animate-pulse"
            )}
          >
            {isReading ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
};