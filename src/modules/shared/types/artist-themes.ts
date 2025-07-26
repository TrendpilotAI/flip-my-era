export interface ArtistTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    destructive: string;
    destructiveForeground: string;
  };
  gradients: {
    hero: string;
    button: string;
    card: string;
  };
  images: {
    backgroundPattern?: string;
    heroBackground?: string;
  };
  topSongs: string[];
  bio: string;
  era: string;
  genre: string;
}

export const artistThemes: Record<string, ArtistTheme> = {
  'the-beatles': {
    id: 'the-beatles',
    name: 'The Beatles',
    colors: {
      primary: '#1e40af', // blue-700
      secondary: '#fbbf24', // yellow-400
      accent: '#ef4444', // red-500
      background: '#f8fafc', // slate-50
      foreground: '#0f172a', // slate-900
      muted: '#f1f5f9', // slate-100
      mutedForeground: '#64748b', // slate-500
      card: '#ffffff',
      cardForeground: '#0f172a',
      border: '#e2e8f0', // slate-200
      input: '#ffffff',
      ring: '#1e40af',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-blue-600 to-yellow-500',
      button: 'from-blue-500 to-blue-700',
      card: 'from-blue-50 to-yellow-50',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 20% 50%, #1e40af 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fbbf24 0%, transparent 50%)',
      heroBackground: 'linear-gradient(135deg, #1e40af, #fbbf24), url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      'Hey Jude',
      'Come Together',
      'Let It Be',
      'Here Comes the Sun',
      'Yesterday',
      'Something',
      'While My Guitar Gently Weeps',
      'A Hard Day\'s Night',
      'Help!',
      'All You Need Is Love'
    ],
    bio: 'The Beatles were an English rock band formed in Liverpool in 1960. The group consisted of John Lennon, Paul McCartney, George Harrison and Ringo Starr. They are regarded as the most influential band of all time and were integral to the development of 1960s counterculture and popular music\'s recognition as an art form.',
    era: '1960s',
    genre: 'Rock, Pop'
  },
  'the-rolling-stones': {
    id: 'the-rolling-stones',
    name: 'The Rolling Stones',
    colors: {
      primary: '#dc2626', // red-600
      secondary: '#1f2937', // gray-800
      accent: '#fbbf24', // yellow-400
      background: '#0f172a', // slate-900
      foreground: '#f1f5f9', // slate-100
      muted: '#1e293b', // slate-800
      mutedForeground: '#94a3b8', // slate-400
      card: '#1e293b',
      cardForeground: '#f1f5f9',
      border: '#334155', // slate-700
      input: '#1e293b',
      ring: '#dc2626',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-red-600 to-gray-900',
      button: 'from-red-500 to-red-700',
      card: 'from-red-950 to-gray-900',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 30% 80%, #dc2626 0%, transparent 50%), radial-gradient(circle at 70% 30%, #1f2937 0%, transparent 50%)',
      heroBackground: 'linear-gradient(135deg, #dc2626, #1f2937), url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M20 20c11 0 20-9 20-20H20v20z"/%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      '(I Can\'t Get No) Satisfaction',
      'Paint It Black',
      'Start Me Up',
      'Gimme Shelter',
      'Brown Sugar',
      'Angie',
      'You Can\'t Always Get What You Want',
      'Miss You',
      'Beast of Burden',
      'Wild Horses'
    ],
    bio: 'The Rolling Stones are an English rock band formed in London in 1962. Active for over six decades, they are one of the most popular and enduring bands of the rock era. Known for their blues and rock and roll sound, they became the musical and cultural rivals to The Beatles during the British Invasion.',
    era: '1960s-Present',
    genre: 'Rock, Blues Rock'
  },
  'taylor-swift': {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    colors: {
      primary: '#a855f7', // purple-500
      secondary: '#ec4899', // pink-500
      accent: '#fbbf24', // yellow-400
      background: '#fdf4ff', // purple-50
      foreground: '#581c87', // purple-900
      muted: '#f3e8ff', // purple-100
      mutedForeground: '#7c3aed', // purple-600
      card: '#ffffff',
      cardForeground: '#581c87',
      border: '#d8b4fe', // purple-300
      input: '#ffffff',
      ring: '#a855f7',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-purple-500 to-pink-500',
      button: 'from-purple-500 to-purple-700',
      card: 'from-purple-50 to-pink-50',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 25% 25%, #a855f7 0%, transparent 50%), radial-gradient(circle at 75% 75%, #ec4899 0%, transparent 50%)',
      heroBackground: 'linear-gradient(135deg, #a855f7, #ec4899), url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M30 0c16.569 0 30 13.431 30 30s-13.431 30-30 30S0 46.569 0 30 13.431 0 30 0zm0 6c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24S43.255 6 30 6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      'Anti-Hero',
      'Shake It Off',
      'Blank Space',
      'Love Story',
      'You Belong With Me',
      'Bad Blood',
      'Delicate',
      'Look What You Made Me Do',
      'We Are Never Ever Getting Back Together',
      'The Man'
    ],
    bio: 'Taylor Swift is an American singer-songwriter known for her narrative songwriting, which often centers around her personal life and has received widespread critical praise and media coverage. She has won numerous awards and is one of the best-selling music artists of all time.',
    era: '2000s-Present',
    genre: 'Pop, Country, Folk'
  },
  'lil-baby': {
    id: 'lil-baby',
    name: 'Lil Baby',
    colors: {
      primary: '#16a34a', // green-600
      secondary: '#eab308', // yellow-500
      accent: '#0ea5e9', // sky-500
      background: '#f0fdf4', // green-50
      foreground: '#14532d', // green-900
      muted: '#dcfce7', // green-100
      mutedForeground: '#16a34a', // green-600
      card: '#ffffff',
      cardForeground: '#14532d',
      border: '#86efac', // green-300
      input: '#ffffff',
      ring: '#16a34a',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-green-500 to-yellow-500',
      button: 'from-green-500 to-green-700',
      card: 'from-green-50 to-yellow-50',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 40% 20%, #16a34a 0%, transparent 50%), radial-gradient(circle at 60% 80%, #eab308 0%, transparent 50%)',
      heroBackground: 'linear-gradient(135deg, #16a34a, #eab308), url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M0 0h20v20H0z"/%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      'The Bigger Picture',
      'Drip Too Hard',
      'My Dawg',
      'Yes Indeed',
      'Life Goes On',
      'Emotionally Scarred',
      'We Paid',
      'Sum 2 Prove',
      'Close Friends',
      'Right On'
    ],
    bio: 'Lil Baby is an American rapper who rose to prominence in 2017 following the release of his mixtape Perfect Timing. Known for his melodic flow and introspective lyrics about street life and success, he has become one of the most influential rappers of his generation.',
    era: '2010s-Present',
    genre: 'Hip Hop, Trap'
  },
  'morgan-wallen': {
    id: 'morgan-wallen',
    name: 'Morgan Wallen',
    colors: {
      primary: '#dc2626', // red-600
      secondary: '#a3a3a3', // neutral-400
      accent: '#1d4ed8', // blue-700
      background: '#fef2f2', // red-50
      foreground: '#7f1d1d', // red-900
      muted: '#fee2e2', // red-100
      mutedForeground: '#991b1b', // red-800
      card: '#ffffff',
      cardForeground: '#7f1d1d',
      border: '#fca5a5', // red-300
      input: '#ffffff',
      ring: '#dc2626',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-red-600 to-blue-700',
      button: 'from-red-500 to-red-700',
      card: 'from-red-50 to-neutral-50',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 15% 85%, #dc2626 0%, transparent 50%), radial-gradient(circle at 85% 15%, #1d4ed8 0%, transparent 50%)',
      heroBackground: 'linear-gradient(135deg, #dc2626, #1d4ed8), url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Cpath d="M20 20c0-11.046-8.954-20-20-20v20h20z"/%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      'Wasted on You',
      'More Than My Hometown',
      'Chasin\' You',
      '7 Summers',
      'The Good Ones',
      'Sand in My Boots',
      'Heartbreak on the Map',
      'Cover Me Up',
      'Whiskey Glasses',
      'Up Down'
    ],
    bio: 'Morgan Wallen is an American country singer and songwriter who gained fame as a contestant on The Voice. Known for his distinctive voice and blend of country and rock influences, he has become one of the biggest stars in modern country music.',
    era: '2010s-Present',
    genre: 'Country, Country Rock'
  },
  'guns-n-roses': {
    id: 'guns-n-roses',
    name: 'Guns \'N\' Roses',
    colors: {
      primary: '#dc2626', // red-600
      secondary: '#000000', // black
      accent: '#fbbf24', // yellow-400
      background: '#1f2937', // gray-800
      foreground: '#f9fafb', // gray-50
      muted: '#374151', // gray-700
      mutedForeground: '#d1d5db', // gray-300
      card: '#374151',
      cardForeground: '#f9fafb',
      border: '#6b7280', // gray-500
      input: '#374151',
      ring: '#dc2626',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-red-600 to-black',
      button: 'from-red-500 to-red-700',
      card: 'from-gray-800 to-gray-900',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 50% 50%, #dc2626 0%, transparent 60%), radial-gradient(circle at 25% 75%, #000000 0%, transparent 60%)',
      heroBackground: 'linear-gradient(135deg, #dc2626, #000000), url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M0 0h80v80H0z"/%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      'Sweet Child O\' Mine',
      'Welcome to the Jungle',
      'Paradise City',
      'November Rain',
      'Don\'t Cry',
      'Patience',
      'Civil War',
      'Knockin\' on Heaven\'s Door',
      'Mr. Brownstone',
      'Nightrain'
    ],
    bio: 'Guns N\' Roses is an American hard rock band formed in Los Angeles in 1985. Known for their rebellious image and powerful live performances, they became one of the most successful rock bands of all time with their debut album "Appetite for Destruction" becoming the best-selling debut album in US history.',
    era: '1980s-Present',
    genre: 'Hard Rock, Heavy Metal'
  },
  'eminem': {
    id: 'eminem',
    name: 'Eminem',
    colors: {
      primary: '#374151', // gray-700
      secondary: '#dc2626', // red-600
      accent: '#fbbf24', // yellow-400
      background: '#f3f4f6', // gray-100
      foreground: '#111827', // gray-900
      muted: '#e5e7eb', // gray-200
      mutedForeground: '#6b7280', // gray-500
      card: '#ffffff',
      cardForeground: '#111827',
      border: '#d1d5db', // gray-300
      input: '#ffffff',
      ring: '#374151',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    gradients: {
      hero: 'from-gray-700 to-red-600',
      button: 'from-gray-600 to-gray-800',
      card: 'from-gray-50 to-red-50',
    },
    images: {
      backgroundPattern: 'radial-gradient(circle at 30% 30%, #374151 0%, transparent 50%), radial-gradient(circle at 70% 70%, #dc2626 0%, transparent 50%)',
      heroBackground: 'linear-gradient(135deg, #374151, #dc2626), url("data:image/svg+xml,%3Csvg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M25 0v25L0 0h25zm0 25v25h25L25 25z"/%3E%3C/g%3E%3C/svg%3E")',
    },
    topSongs: [
      'Lose Yourself',
      'The Real Slim Shady',
      'Without Me',
      'Stan',
      'Love The Way You Lie',
      'Not Afraid',
      'The Monster',
      'Rap God',
      'Till I Collapse',
      'Cleanin\' Out My Closet'
    ],
    bio: 'Eminem is an American rapper, songwriter, and record producer. Credited with breaking racial barriers for the acceptance of white rappers in popular music, he is one of the best-selling music artists of all time and is widely considered one of the greatest rappers of all time.',
    era: '1990s-Present',
    genre: 'Hip Hop, Rap'
  }
};

export const artistOptions = Object.values(artistThemes).map(theme => ({
  id: theme.id,
  name: theme.name,
  genre: theme.genre,
}));