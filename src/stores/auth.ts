import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { NxUser } from "../types/api";

/**
 * Session store — the bearer token lives ONLY in SecureStore (never plain
 * AsyncStorage, never logs). The /api/auth/me response shape is
 * { success, user: { id, username, createdAt } }.
 */

type AuthStatus = "hydrating" | "loading" | "authenticated" | "guest";

interface AuthState {
  token: string | null;
  user: NxUser | null;
  status: AuthStatus;
  error: string | null;
  init: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Called by the API client when any endpoint answers 401 with a stale token. */
  sessionExpired: () => Promise<void>;
  setError: (message: string | null) => void;
}

const TOKEN_KEY = "nxmirror.session.token";
const USER_KEY = "nxmirror.session.user";

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  status: "hydrating",
  error: null,

  init: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ status: "guest", token: null, user: null });
        return;
      }
      const cachedUser = await SecureStore.getItemAsync(USER_KEY);
      set({ token, user: cachedUser ? (JSON.parse(cachedUser) as NxUser) : null, status: "authenticated" });
    } catch {
      set({ status: "guest", token: null, user: null });
    }
  },

  login: async (username, password) => {
    set({ status: "loading", error: null });
    try {
      const { apiPost } = await import("../services/api/client");
      const data = await apiPost<{ success: boolean; user: NxUser; token: string }>("auth/login", {
        username,
        password
      });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, status: "authenticated", error: null });
      return true;
    } catch (error) {
      set({ status: "guest", error: error instanceof Error ? error.message : "Login failed." });
      return false;
    }
  },

  register: async (username, password) => {
    set({ status: "loading", error: null });
    try {
      const { apiPost } = await import("../services/api/client");
      const data = await apiPost<{ success: boolean; user: NxUser; token: string }>("auth/register", {
        username,
        password
      });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, status: "authenticated", error: null });
      return true;
    } catch (error) {
      set({ status: "guest", error: error instanceof Error ? error.message : "Registration failed." });
      return false;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      /* best-effort cleanup */
    }
    set({ token: null, user: null, status: "guest", error: null });
  },

  sessionExpired: async () => {
    if (!get().token) return;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      /* ignore */
    }
    set({ token: null, user: null, status: "guest", error: "Your session expired. Sign in again." });
  },

  setError: (error) => set({ error })
}));
