export type ThemeName = 'default' | 'hustler' | 'feminine';

export interface Theme {
  name: ThemeName;
  displayName: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  white: string;
  dark: string;
  gray: string;
  lightGray: string;
  border: string;
  card: string;
  shadow: string;
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    displayName: 'Midnight',
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#0F172A',
    white: '#F8FAFC',
    dark: '#F8FAFC',
    gray: '#94A3B8',
    lightGray: '#1E293B',
    border: '#334155',
    card: '#1E293B',
    shadow: 'rgba(0,0,0,0.3)',
  },
  hustler: {
    name: 'hustler',
    displayName: 'Hustler',
    primary: '#F59E0B',
    secondary: '#D97706',
    success: '#F59E0B',
    warning: '#FBBF24',
    danger: '#DC2626',
    background: '#000000',
    white: '#F59E0B',
    dark: '#FFFFFF',
    gray: '#A1A1AA',
    lightGray: '#18181B',
    border: '#3F3F46',
    card: '#18181B',
    shadow: 'rgba(245,158,11,0.2)',
  },
  feminine: {
    name: 'feminine',
    displayName: 'Bloom',
    primary: '#EC4899',
    secondary: '#DB2777',
    success: '#10B981',
    warning: '#F472B6',
    danger: '#EF4444',
    background: '#FDF2F8',
    white: '#FFFFFF',
    dark: '#831843',
    gray: '#9D174D',
    lightGray: '#FCE7F3',
    border: '#FBCFE8',
    card: '#FFFFFF',
    shadow: 'rgba(236,72,153,0.15)',
  },
};

export const colors = themes.default;

export const categories = [
  { value: 'health', label: 'Health', icon: '❤️', color: '#EF4444' },
  { value: 'fitness', label: 'Fitness', icon: '💪', color: '#F59E0B' },
  { value: 'work', label: 'Work', icon: '💼', color: '#6366F1' },
  { value: 'education', label: 'Education', icon: '📚', color: '#10B981' },
  { value: 'custom', label: 'Custom', icon: '⭐', color: '#8B5CF6' },
] as const;
