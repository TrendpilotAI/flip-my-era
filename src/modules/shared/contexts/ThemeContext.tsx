import React, { createContext, useContext, useEffect, useState } from 'react';
import { ArtistTheme, artistThemes } from '@/modules/shared/types/artist-themes';

interface ThemeContextType {
  currentTheme: ArtistTheme;
  setArtistTheme: (artistId: string) => void;
  isThemeSet: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'flipmyera-artist-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ArtistTheme>(artistThemes['the-beatles']); // Default theme - changed from taylor-swift
  const [isThemeSet, setIsThemeSet] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId && artistThemes[savedThemeId]) {
      setCurrentTheme(artistThemes[savedThemeId]);
      setIsThemeSet(true);
      applyThemeToDocument(artistThemes[savedThemeId]);
    }
  }, []);

  const setArtistTheme = (artistId: string) => {
    const theme = artistThemes[artistId];
    if (theme) {
      setCurrentTheme(theme);
      setIsThemeSet(true);
      localStorage.setItem(THEME_STORAGE_KEY, artistId);
      applyThemeToDocument(theme);
    }
  };

  const applyThemeToDocument = (theme: ArtistTheme) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--input', theme.colors.input);
    root.style.setProperty('--ring', theme.colors.ring);
    root.style.setProperty('--destructive', theme.colors.destructive);
    root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
    
    // Apply gradient variables
    root.style.setProperty('--gradient-hero', theme.gradients.hero);
    root.style.setProperty('--gradient-button', theme.gradients.button);
    root.style.setProperty('--gradient-card', theme.gradients.card);
  };

  const value: ThemeContextType = {
    currentTheme,
    setArtistTheme,
    isThemeSet,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};