import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'light' | 'dark';
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  setTheme: (theme: 'light' | 'dark') => void;
  setCustomColors: (colors: { primary: string; secondary: string; accent: string }) => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      customColors: {
        primary: '#9b87f5',
        secondary: '#1A1F2C',
        accent: '#8B5CF6',
      },
      setTheme: (theme) => set({ theme }),
      setCustomColors: (colors) => set({ customColors: colors }),
    }),
    {
      name: 'theme-storage',
    }
  )
);