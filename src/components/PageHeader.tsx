
import { Sparkles, Clock, BookOpen } from "lucide-react";

export const PageHeader = () => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-shimmer pb-2">
          FlipMyEra
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Transform your life story into a whimsical journey through time. Discover how your path might have unfolded in a different era.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 text-gray-600">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span>AI-Powered Storytelling</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-pink-500" />
          <span>Time-Travel Narratives</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <span>Personalized E-Memory Books</span>
        </div>
      </div>
    </div>
  );
};
