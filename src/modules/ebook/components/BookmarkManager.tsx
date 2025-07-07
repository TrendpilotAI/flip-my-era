import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { ScrollArea } from '@/modules/shared/components/ui/scroll-area';
import { Input } from '@/modules/shared/components/ui/input';
import { 
  X,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Clock,
  Edit,
  Check,
  Search,
  Heart,
  Star,
  Music,
  Sparkles
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface Bookmark {
  id: string;
  chapterIndex: number;
  pageIndex: number;
  position: number;
  note?: string;
  timestamp: Date;
}

interface BookmarkManagerProps {
  bookmarks: Bookmark[];
  chapters: Chapter[];
  onBookmarkSelect: (bookmark: Bookmark) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onClose: () => void;
  useTaylorSwiftThemes?: boolean;
  darkMode?: boolean;
}

export const BookmarkManager = ({
  bookmarks,
  chapters,
  onBookmarkSelect,
  onBookmarkDelete,
  onClose,
  useTaylorSwiftThemes = true,
  darkMode = false
}: BookmarkManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const chapter = chapters[bookmark.chapterIndex];
    if (!chapter) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      chapter.title.toLowerCase().includes(searchLower) ||
      (bookmark.note?.toLowerCase().includes(searchLower))
    );
  });

  const sortedBookmarks = filteredBookmarks.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleEditStart = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark.id);
    setEditNote(bookmark.note || "");
  };

  const handleEditSave = (bookmarkId: string) => {
    // In a real implementation, this would update the bookmark
    setEditingBookmark(null);
    setEditNote("");
  };

  const getBookmarkIcon = (index: number) => {
    if (!useTaylorSwiftThemes) return <Bookmark className="h-4 w-4 text-blue-500" />;
    
    const icons = [
      <Heart className="h-4 w-4 text-pink-500" />,
      <Star className="h-4 w-4 text-yellow-500" />,
      <Music className="h-4 w-4 text-purple-500" />,
      <Sparkles className="h-4 w-4 text-blue-500" />
    ];
    return icons[index % icons.length];
  };

  return (
    <Card className={cn(
      "h-full border-0 rounded-none transition-all duration-300",
      darkMode 
        ? "bg-black/40 backdrop-blur-md border-l border-white/10" 
        : "bg-white/90 backdrop-blur-md border-l border-gray-200"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center space-x-2 text-lg",
            darkMode ? "text-white" : "text-gray-900",
            useTaylorSwiftThemes && "text-purple-700 dark:text-purple-300"
          )}>
            <Bookmark className="h-5 w-5" />
            <span>Bookmarks</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              "transition-colors",
              useTaylorSwiftThemes ? "text-purple-600 hover:text-purple-700" : "text-blue-600 hover:text-blue-700"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-9 transition-colors",
              darkMode ? "bg-black/20 border-white/20" : "bg-white border-gray-200"
            )}
          />
        </div>

        {/* Stats */}
        <div className={cn(
          "p-3 rounded-lg mt-4",
          darkMode ? "bg-white/10" : "bg-gray-100"
        )}>
          <div className="flex items-center justify-between text-sm">
            <span className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>
              Total Bookmarks
            </span>
            <span className={cn(
              "font-medium",
              useTaylorSwiftThemes ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
            )}>
              {bookmarks.length}
            </span>
          </div>
          {filteredBookmarks.length !== bookmarks.length && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>
                Filtered Results
              </span>
              <span className={cn(
                "font-medium",
                useTaylorSwiftThemes ? "text-pink-600 dark:text-pink-400" : "text-blue-600 dark:text-blue-400"
              )}>
                {filteredBookmarks.length}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-[calc(100vh-250px)]">
          {sortedBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookmarkPlus className={cn(
                "h-12 w-12 mb-4",
                darkMode ? "text-gray-400" : "text-gray-300"
              )} />
              <p className={cn(
                "text-sm mb-2",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                {searchTerm ? "No bookmarks found" : "No bookmarks yet"}
              </p>
              <p className={cn(
                "text-xs",
                darkMode ? "text-gray-500" : "text-gray-400"
              )}>
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Bookmark chapters to save your reading progress"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBookmarks.map((bookmark, index) => {
                const chapter = chapters[bookmark.chapterIndex];
                if (!chapter) return null;

                return (
                  <div
                    key={bookmark.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                      darkMode 
                        ? "bg-white/5 border-white/10 hover:bg-white/10" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onBookmarkSelect(bookmark)}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          {getBookmarkIcon(index)}
                          <h3 className={cn(
                            "text-sm font-medium truncate",
                            darkMode ? "text-white" : "text-gray-900"
                          )}>
                            {chapter.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-xs space-x-3 mb-2">
                          <span className={cn(
                            darkMode ? "text-gray-400" : "text-gray-500"
                          )}>
                            Chapter {bookmark.chapterIndex + 1}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span className={cn(
                              darkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                              {formatTimestamp(bookmark.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Bookmark Note */}
                        {editingBookmark === bookmark.id ? (
                          <div className="flex items-center space-x-2 mt-2">
                            <Input
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Add a note..."
                              className="text-xs h-7"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSave(bookmark.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : bookmark.note && (
                          <p className={cn(
                            "text-xs mt-2 italic",
                            darkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            "{bookmark.note}"
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(bookmark)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onBookmarkDelete(bookmark.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Bookmark Type Indicator */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        {bookmark.note === 'Auto-bookmark' ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Auto
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              useTaylorSwiftThemes ? "bg-purple-500" : "bg-blue-500"
                            )} />
                            <span className={cn(
                              "text-xs",
                              useTaylorSwiftThemes ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
                            )}>
                              Manual
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(bookmark.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};