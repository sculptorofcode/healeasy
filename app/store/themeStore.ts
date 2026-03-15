import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',

  setTheme: async (theme: ThemeMode) => {
    try {
      await AsyncStorage.setItem('app_theme', theme);
      set({ theme });
      console.log('[ThemeStore] Theme changed to:', theme);
    } catch (error) {
      console.error('[ThemeStore] Error saving theme:', error);
    }
  },

  initTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        set({ theme: savedTheme as ThemeMode });
        console.log('[ThemeStore] Loaded theme:', savedTheme);
      }
    } catch (error) {
      console.error('[ThemeStore] Error loading theme:', error);
    }
  },
}));

// Hook to get the effective color scheme based on theme preference
export const useEffectiveColorScheme = (systemColorScheme: 'light' | 'dark' | undefined | null): 'light' | 'dark' => {
  const theme = useThemeStore((state) => state.theme);
  
  if (theme === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return theme;
};
