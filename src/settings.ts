import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * User settings — persisted with AsyncStorage on native, in-memory on web.
 *
 * These personalize the app: the user's name, the cat's name,
 * preferred language, and eventually theme colors.
 */

export interface Settings {
  userName: string;
  catName: string;
  language: 'en' | 'zh' | 'auto';
}

const DEFAULTS: Settings = {
  userName: '',
  catName: 'Cato',
  language: 'auto',
};

const STORAGE_KEY = 'cato_settings';

interface SettingsState extends Settings {
  isLoaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<Settings>) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,

  load: async () => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Settings>;
          set({ ...DEFAULTS, ...saved, isLoaded: true });
          return;
        }
      } catch { /* fall through */ }
      set({ isLoaded: true });
      return;
    }

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Settings>;
        set({ ...DEFAULTS, ...saved, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  update: async (partial) => {
    const current = get();
    const next = { ...current, ...partial };
    set(partial);

    const toSave: Settings = {
      userName: next.userName,
      catName: next.catName,
      language: next.language,
    };

    if (Platform.OS === 'web') {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
      return;
    }

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* best effort */ }
  },
}));
