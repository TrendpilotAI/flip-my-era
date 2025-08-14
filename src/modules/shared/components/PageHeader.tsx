
import { Sparkles, Clock, BookOpen } from "lucide-react";
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

export const PageHeader = () => {
  const { currentTheme } = useTheme();
  const location = useLocation();
  const shouldHideSubtitle = location.pathname === '/about' || location.pathname === '/';
  
  return <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 
          className="text-5xl md:text-6xl bg-clip-text text-transparent animate-shimmer pb-2 font-bold"
          style={{
            backgroundImage: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary}, ${currentTheme.colors.accent})`
          }}
        >
          ✨ FlipMyEra ✨
        </h1>
        {!shouldHideSubtitle && (
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Rewrite your story in a kinder, pre-2020 timeline
            <span 
              className="block mt-2 text-lg italic"
              style={{ color: currentTheme.colors.primary }}
            >
              Where festivals were endless, summers were perfect and dreams felt limitless.
            </span>
          </p>
        )}
      </div>

      {!shouldHideSubtitle && (
        <div className="flex flex-wrap justify-center gap-8 text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
            <span>✨ AI Magic Storytelling</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: currentTheme.colors.secondary }} />
            <span>Time-Travel Narratives</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: currentTheme.colors.accent }} />
            <span>Memory Books That Hit Different</span>
          </div>
        </div>
      )}
    </div>;
};
