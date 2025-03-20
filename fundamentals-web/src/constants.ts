// API Configuration
export const API_URL = 'http://localhost:3000';

// Query Configuration
export const QUERY_CONFIG = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnMount: 'always',
} as const;

/**
 * Theme Configuration
 * 
 * Color palette and styling constants for the diff viewer application
 */
export const THEME_COLORS = {
  background: {
    primary: 'rgba(13, 15, 18, 0.97)',
    secondary: 'rgba(20, 22, 26, 0.97)',
    hover: 'rgba(26, 28, 32, 0.97)',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.06)',
    glow: 'rgba(51, 154, 240, 0.5)',
  },
  shadow: {
    primary: '0 8px 32px rgba(0, 0, 0, 0.8)',
    header: '0 4px 20px rgba(0, 0, 0, 0.6)',
    navbar: '4px 0 16px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(51, 154, 240, 0.2)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.75)',
    accent: '#339af0',
  },
  diff: {
    added: {
      background: 'rgba(38, 151, 97, 0.2)',
      border: 'rgba(38, 151, 97, 0.6)',
      text: '#26b571',
    },
    removed: {
      background: 'rgba(201, 42, 42, 0.2)',
      border: 'rgba(201, 42, 42, 0.6)',
      text: '#e03131',
    },
    unchanged: {
      background: 'transparent',
      border: 'transparent',
    },
    highlight: {
      added: 'rgba(38, 151, 97, 0.4)',
      removed: 'rgba(201, 42, 42, 0.4)',
    }
  }
} as const;

// Layout Configuration
export const LAYOUT = {
  header: {
    height: 50, // Reduced height for more space
  },
  navbar: {
    width: 280, // Slightly narrower for more content space
    breakpoint: 'sm',
  },
} as const; 