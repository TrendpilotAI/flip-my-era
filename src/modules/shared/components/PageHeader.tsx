
import { Sparkles, Clock, BookOpen } from "lucide-react";
export const PageHeader = () => {
  return <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-shimmer pb-2 font-bold">✨ FlipMyEra ✨</h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Rewrite your story in a kinder, pre-2020 timeline
          <span className="block mt-2 text-lg italic text-purple-600">
            Where festivals were endless, summers were perfect and dreams felt limitless.
          </span>
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 text-gray-600">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span>✨ AI Magic Storytelling</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-pink-500" />
          <span>Time-Travel Narratives</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <span>Memory Books That Hit Different</span>
        </div>
      </div>
    </div>;
};
