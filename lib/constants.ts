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
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    displayName: 'Classic Blue',
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    background: '#F2F2F7',
    white: '#FFFFFF',
    dark: '#1C1C1E',
    gray: '#8E8E93',
    lightGray: '#E5E5EA',
    border: '#C6C6C8',
  },
  hustler: {
    name: 'hustler',
    displayName: 'Hustler',
    primary: '#D4AF37',
    secondary: '#B8860B',
    success: '#D4AF37',
    warning: '#DAA520',
    danger: '#DC143C',
    background: '#000000',
    white: '#D4AF37',
    dark: '#FFFFFF',
    gray: '#A0A0A0',
    lightGray: '#1A1A1A',
    border: '#333333',
  },
  feminine: {
    name: 'feminine',
    displayName: 'Feminine',
    primary: '#FF69B4',
    secondary: '#FF1493',
    success: '#FF69B4',
    warning: '#FFB6C1',
    danger: '#FF6347',
    background: '#FFF0F5',
    white: '#FFFFFF',
    dark: '#8B4557',
    gray: '#B0858F',
    lightGray: '#FFD6E0',
    border: '#FFB6C1',
  },
};

// Default to classic blue
export const colors = themes.default;
export const categories = [
  { value: 'health', label: 'Health' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'work', label: 'Work' },
  { value: 'education', label: 'Education' },
  { value: 'custom', label: 'Custom' },
] as const;
