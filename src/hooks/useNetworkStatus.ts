import { useEffect, useState } from "react";
import * as Network from "expo-network";
import { AppState } from "react-native";
import { apiGet, normalizeError } from "../services/api/client";

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  /** Result of a real probe against the NxMirror API — never assumed. */
  apiReachable: boolean | null;
  checkedAt: number | null;
  refresh: () => void;
}

/**
 * Connectivity hook: expo-network connectivity + a lightweight real probe
 * (GET /api/db service info) to decide whether the NxMirror API is actually
 * reachable. Re-checks on app foreground and on demand.
 */
export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState<{
    isConnected: boolean;
    isInternetReachable: boolean | null;
    apiReachable: boolean | null;
    checkedAt: number | null;
  }>({ isConnected: true, isInternetReachable: null, apiReachable: null, checkedAt: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      let isConnected = true;
      let isInternetReachable: boolean | null = null;
      try {
        const net = await Network.getNetworkStateAsync();
        isConnected = !!net.isConnected;
        isInternetReachable = net.isInternetReachable ?? null;
      } catch {
        /* fall through to the API probe */
      }
      let apiReachable: boolean | null = null;
      if (isConnected) {
        try {
          await apiGet("db", { timeoutMs: 9000, retries: 0 });
          apiReachable = true;
        } catch (error) {
          const normalized = normalizeError(error);
          apiReachable = false;
          if (normalized instanceof Error && normalized.message) {
            // Timeout/HTTP differences don't matter — only reachability does.
          }
        }
      }
      if (!cancelled) setState({ isConnected, isInternetReachable, apiReachable, checkedAt: Date.now() });
    };

    check();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") check();
    });
    const interval = setInterval(check, 45000);
    return () => {
      cancelled = true;
      subscription.remove();
      clearInterval(interval);
    };
  }, [tick]);

  return {
    ...state,
    refresh: () => setTick((value) => value + 1)
  };
}
