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
    primary: '#FFD700',
    secondary: '#DAA520',
    success: '#FFD700',
    warning: '#FFA500',
    danger: '#FF4444',
    background: '#000000',
    white: '#FFD700',
    dark: '#FFFFFF',
    gray: '#888888',
    lightGray: '#333333',
    border: '#444444',
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
