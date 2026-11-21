import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Local, device-only search history (max 12 entries, newest first). */
interface SearchHistoryState {
  history: string[];
  hydrated: boolean;
  add: (term: string) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

const KEY = "nxmirror.search-history.v1";
const MAX = 12;

export const useSearchHistoryStore = create<SearchHistoryState>((set, get) => ({
  history: [],
  hydrated: false,
  add: (term) => {
    const value = term.trim();
    if (!value) return;
    const next = [value, ...get().history.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, MAX);
    set({ history: next });
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  },
  clear: () => {
    set({ history: [] });
    AsyncStorage.removeItem(KEY).catch(() => undefined);
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ history: JSON.parse(raw) as string[] });
    } catch {
      /* ignore */
    } finally {
      set({ hydrated: true });
    }
  }
}));
