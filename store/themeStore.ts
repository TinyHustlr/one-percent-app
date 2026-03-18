import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeName, themes } from '../lib/constants';

const THEME_STORAGE_KEY = 'app-theme';

interface ThemeState {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: themes.default,
  themeName: 'default',

  setTheme: async (name: ThemeName) => {
    const theme = themes[name];
    set({ theme, themeName: name });
    await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
  },

  loadTheme: async () => {
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && savedTheme in themes) {
      const theme = themes[savedTheme as ThemeName];
      set({ theme, themeName: savedTheme as ThemeName });
    }
  },
}));
