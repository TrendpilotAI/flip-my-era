export interface ThemeImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export interface ThemeImageCollection {
  [themeId: string]: ThemeImage[];
}

// Beatles theme images - using the uploaded Beatles photos
export const beatlesImages: ThemeImage[] = [
  {
    id: 'beatles-1',
    src: '/images/themes/beatles/beatles-1.avif',
    alt: 'The Beatles - Abbey Road',
    caption: 'Abbey Road 🎸'
  },
  {
    id: 'beatles-2', 
    src: '/images/themes/beatles/beatles-2.avif',
    alt: 'The Beatles - Love is All You Need',
    caption: 'All You Need is Love 💕'
  },
  {
    id: 'beatles-3',
    src: '/images/themes/beatles/beatles-3.avif', 
    alt: 'The Beatles - Sergeant Pepper',
    caption: 'Sergeant Pepper 🎵'
  },
  {
    id: 'beatles-4',
    src: '/images/themes/beatles/beatles-4.avif',
    alt: 'The Beatles',
    caption: 'Fab Four ⭐'
  },
  {
    id: 'beatles-5',
    src: '/images/themes/beatles/beatles-1.avif',
    alt: 'The Beatles - Abbey Road',
    caption: 'Abbey Road 🎸'
  },
  {
    id: 'beatles-6',
    src: '/images/themes/beatles/beatles-2.avif',
    alt: 'The Beatles - Love is All You Need',
    caption: 'All You Need is Love 💕'
  },
  {
    id: 'beatles-7',
    src: '/images/themes/beatles/beatles-3.avif',
    alt: 'The Beatles - Sergeant Pepper',
    caption: 'Sergeant Pepper 🎵'
  },
  {
    id: 'beatles-8',
    src: '/images/themes/beatles/beatles-4.avif',
    alt: 'The Beatles',
    caption: 'Fab Four ⭐'
  },
  {
    id: 'beatles-9',
    src: '/images/themes/beatles/beatles-1.avif',
    alt: 'The Beatles - Abbey Road',
    caption: 'Abbey Road 🎸'
  }
];

// Default images for other themes (keeping the original Unsplash images)
export const defaultImages: ThemeImage[] = [
  {
    id: 'default-1',
    src: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
    alt: 'Beach waves',
    caption: 'Summer waves 🌊'
  },
  {
    id: 'default-2',
    src: 'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7',
    alt: 'Girls night out',
    caption: 'Magic nights ✨'
  },
  {
    id: 'default-3',
    src: 'https://images.unsplash.com/photo-1514912885225-5c9ec8507d68',
    alt: 'Concert lights',
    caption: 'Music vibes 🎵'
  },
  {
    id: 'default-4',
    src: 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f',
    alt: 'Friends at sunset beach',
    caption: 'Golden hour 🌅'
  },
  {
    id: 'default-5',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    alt: 'Serene lake',
    caption: 'Lake dreams 🌲'
  },
  {
    id: 'default-6',
    src: 'https://images.unsplash.com/photo-1517022812141-23620dba5c23',
    alt: 'Fluffy sheep',
    caption: 'Daydreaming 🌸'
  },
  {
    id: 'default-7',
    src: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    alt: 'Cozy cat',
    caption: 'Lazy days 😺'
  },
  {
    id: 'default-8',
    src: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07',
    alt: 'Starry night',
    caption: 'Starlit dreams ⭐'
  },
  {
    id: 'default-9',
    src: 'https://images.unsplash.com/photo-1498936178812-4b2e558d2937',
    alt: 'Flying bees',
    caption: 'Nature\'s dance 🐝'
  }
];

// Theme image collections mapping
export const themeImageCollections: ThemeImageCollection = {
  'the-beatles': beatlesImages,
  // Add other themes here as you upload more photos
  'taylor-swift': defaultImages,
  'the-rolling-stones': defaultImages,
  'lil-baby': defaultImages,
  'morgan-wallen': defaultImages,
  'guns-n-roses': defaultImages,
  'eminem': defaultImages
};

// Helper function to get images for a specific theme
export const getThemeImages = (themeId: string): ThemeImage[] => {
  return themeImageCollections[themeId] || defaultImages;
}; 