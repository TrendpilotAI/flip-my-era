import { NavigationBar } from './NavigationBar';
import { ThemeGuard } from './ThemeGuard';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div 
      className="min-h-screen"
      style={{
        background: currentTheme.images.backgroundPattern 
          ? `${currentTheme.images.backgroundPattern}, linear-gradient(135deg, ${currentTheme.colors.background}, ${currentTheme.colors.muted})`
          : `linear-gradient(135deg, ${currentTheme.colors.background}, ${currentTheme.colors.muted})`,
      }}
    >
      <NavigationBar />
      <div className="pt-16">
        <ThemeGuard>
          {children}
        </ThemeGuard>
      </div>
    </div>
  );
};
