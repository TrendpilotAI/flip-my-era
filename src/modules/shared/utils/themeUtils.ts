import { useTheme } from '@/modules/shared/contexts/ThemeContext';

export const useThemeColors = () => {
  const { currentTheme } = useTheme();
  
  return {
    // Primary colors
    primary: currentTheme.colors.primary,
    secondary: currentTheme.colors.secondary,
    accent: currentTheme.colors.accent,
    
    // Background colors
    background: currentTheme.colors.background,
    card: currentTheme.colors.card,
    muted: currentTheme.colors.muted,
    
    // Text colors
    foreground: currentTheme.colors.foreground,
    cardForeground: currentTheme.colors.cardForeground,
    mutedForeground: currentTheme.colors.mutedForeground,
    
    // Border and input colors
    border: currentTheme.colors.border,
    input: currentTheme.colors.input,
    ring: currentTheme.colors.ring,
    
    // Gradients
    gradientHero: currentTheme.gradients.hero,
    gradientButton: currentTheme.gradients.button,
    gradientCard: currentTheme.gradients.card,
    
    // Utility functions
    getGradientClass: (type: 'hero' | 'button' | 'card' = 'button') => {
      const gradient = currentTheme.gradients[type];
      return `bg-gradient-to-r ${gradient}`;
    },
    
    getHoverGradientClass: (type: 'hero' | 'button' | 'card' = 'button') => {
      const gradient = currentTheme.gradients[type];
      // Create a slightly darker version for hover
      return `hover:${gradient.replace('500', '600').replace('400', '500')}`;
    },
    
    // Replace common hardcoded color patterns
    replacePinkPurpleGradient: () => `bg-gradient-to-r ${currentTheme.gradients.hero}`,
    replacePinkPurpleHover: () => `hover:${currentTheme.gradients.hero.replace('500', '600').replace('400', '500')}`,
    
    // Background patterns
    getBackgroundPattern: () => currentTheme.images.backgroundPattern,
    getHeroBackground: () => currentTheme.images.heroBackground,
  };
};

export const getThemeAwareClasses = (baseClasses: string, themeColors: ReturnType<typeof useThemeColors>) => {
  // Replace hardcoded pink/purple classes with theme-aware ones
  let classes = baseClasses;
  
  // Replace common patterns
  classes = classes.replace(/from-purple-\d+/g, `from-[${themeColors.primary}]`);
  classes = classes.replace(/to-pink-\d+/g, `to-[${themeColors.secondary}]`);
  classes = classes.replace(/bg-pink-\d+/g, `bg-[${themeColors.secondary}]`);
  classes = classes.replace(/text-pink-\d+/g, `text-[${themeColors.secondary}]`);
  classes = classes.replace(/border-pink-\d+/g, `border-[${themeColors.secondary}]`);
  
  return classes;
};

export const createThemeAwareStyle = (themeColors: ReturnType<typeof useThemeColors>) => {
  return {
    '--primary': themeColors.primary,
    '--secondary': themeColors.secondary,
    '--accent': themeColors.accent,
    '--background': themeColors.background,
    '--foreground': themeColors.foreground,
    '--card': themeColors.card,
    '--card-foreground': themeColors.cardForeground,
    '--muted': themeColors.muted,
    '--muted-foreground': themeColors.mutedForeground,
    '--border': themeColors.border,
    '--input': themeColors.input,
    '--ring': themeColors.ring,
  } as React.CSSProperties;
};
