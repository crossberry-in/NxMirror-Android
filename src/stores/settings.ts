import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_API_BASE_URL } from "../constants/config";

export type ThemeMode = "dark" | "light" | "system";

interface SettingsState {
  themeMode: ThemeMode;
  apiBaseUrl: string;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setApiBaseUrl: (url: string) => void;
  resetApiBaseUrl: () => void;
  hydrate: () => Promise<void>;
}

const KEY = "nxmirror.settings.v1";

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_API_BASE_URL;
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s]*)?$/i.test(trimmed)) return DEFAULT_API_BASE_URL;
  return trimmed;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: "dark",
  apiBaseUrl: DEFAULT_API_BASE_URL,
  hydrated: false,
  setThemeMode: (themeMode) => {
    set({ themeMode });
    AsyncStorage.setItem(KEY, JSON.stringify({ ...get(), themeMode })).catch(() => undefined);
  },
  setApiBaseUrl: (url) => {
    const apiBaseUrl = normalizeBaseUrl(url);
    set({ apiBaseUrl });
    AsyncStorage.setItem(KEY, JSON.stringify({ ...get(), apiBaseUrl })).catch(() => undefined);
  },
  resetApiBaseUrl: () => get().setApiBaseUrl(DEFAULT_API_BASE_URL),
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        set({
          themeMode: parsed.themeMode === "light" || parsed.themeMode === "system" || parsed.themeMode === "dark" ? parsed.themeMode : "dark",
          apiBaseUrl: parsed.apiBaseUrl ? normalizeBaseUrl(parsed.apiBaseUrl) : DEFAULT_API_BASE_URL
        });
      }
    } catch {
      /* fall back to defaults */
    } finally {
      set({ hydrated: true });
    }
  }
}));
