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

// Rolling Stones theme images - using the uploaded Rolling Stones photos
export const rollingStonesImages: ThemeImage[] = [
  {
    id: 'rolling-stones-1',
    src: '/images/themes/rolling-stones/rolling-stones-1.jpeg',
    alt: 'The Rolling Stones - Live Performance',
    caption: 'Live Legends 🎸'
  },
  {
    id: 'rolling-stones-2',
    src: '/images/themes/rolling-stones/rolling-stones-2.jpeg',
    alt: 'The Rolling Stones - Classic Lineup',
    caption: 'Classic Lineup ⭐'
  },
  {
    id: 'rolling-stones-3',
    src: '/images/themes/rolling-stones/rolling-stones-3.jpeg',
    alt: 'The Rolling Stones - Group Portrait',
    caption: 'Rock Icons 🎵'
  },
  {
    id: 'rolling-stones-4',
    src: '/images/themes/rolling-stones/rolling-stones-4.jpeg',
    alt: 'The Rolling Stones - Logo',
    caption: 'Tongue & Lips 👅'
  },
  {
    id: 'rolling-stones-5',
    src: '/images/themes/rolling-stones/rolling-stones-5.webp',
    alt: 'The Rolling Stones - Sticky Fingers',
    caption: 'Sticky Fingers 🎤'
  },
  {
    id: 'rolling-stones-6',
    src: '/images/themes/rolling-stones/rolling-stones-1.jpeg',
    alt: 'The Rolling Stones - Live Performance',
    caption: 'Live Legends 🎸'
  },
  {
    id: 'rolling-stones-7',
    src: '/images/themes/rolling-stones/rolling-stones-2.jpeg',
    alt: 'The Rolling Stones - Classic Lineup',
    caption: 'Classic Lineup ⭐'
  },
  {
    id: 'rolling-stones-8',
    src: '/images/themes/rolling-stones/rolling-stones-3.jpeg',
    alt: 'The Rolling Stones - Group Portrait',
    caption: 'Rock Icons 🎵'
  },
  {
    id: 'rolling-stones-9',
    src: '/images/themes/rolling-stones/rolling-stones-4.jpeg',
    alt: 'The Rolling Stones - Logo',
    caption: 'Tongue & Lips 👅'
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

// Eminem theme images - using the uploaded Eminem photos
export const eminemImages: ThemeImage[] = [
  {
    id: 'eminem-1',
    src: '/images/themes/eminem/eminem-1.webp',
    alt: 'Eminem - MTV VMA Performance',
    caption: 'MTV VMA 🎤'
  },
  {
    id: 'eminem-2',
    src: '/images/themes/eminem/eminem-2.webp',
    alt: 'Eminem - 8 Mile',
    caption: '8 Mile 🎬'
  },
  {
    id: 'eminem-3',
    src: '/images/themes/eminem/eminem-3.webp',
    alt: 'Eminem - Rehearsing',
    caption: 'Studio Time 🎵'
  },
  {
    id: 'eminem-4',
    src: '/images/themes/eminem/eminem-4.jpeg',
    alt: 'Eminem - The Eminem Show',
    caption: 'The Eminem Show ⭐'
  },
  {
    id: 'eminem-5',
    src: '/images/themes/eminem/eminem-5.webp',
    alt: 'Eminem - Hooded Portrait',
    caption: 'Slim Shady 💯'
  },
  {
    id: 'eminem-6',
    src: '/images/themes/eminem/eminem-1.webp',
    alt: 'Eminem - MTV VMA Performance',
    caption: 'MTV VMA 🎤'
  },
  {
    id: 'eminem-7',
    src: '/images/themes/eminem/eminem-2.webp',
    alt: 'Eminem - 8 Mile',
    caption: '8 Mile 🎬'
  },
  {
    id: 'eminem-8',
    src: '/images/themes/eminem/eminem-3.webp',
    alt: 'Eminem - Rehearsing',
    caption: 'Studio Time 🎵'
  },
  {
    id: 'eminem-9',
    src: '/images/themes/eminem/eminem-4.jpeg',
    alt: 'Eminem - The Eminem Show',
    caption: 'The Eminem Show ⭐'
  }
];

// Theme image collections mapping
export const themeImageCollections: ThemeImageCollection = {
  'the-beatles': beatlesImages,
  'the-rolling-stones': rollingStonesImages,
  // Add other themes here as you upload more photos
  'taylor-swift': defaultImages,
  'eminem': eminemImages
};

// Helper function to get images for a specific theme
export const getThemeImages = (themeId: string): ThemeImage[] => {
  return themeImageCollections[themeId] || defaultImages;
}; 