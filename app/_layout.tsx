import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";

import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { useSettingsStore } from "../src/stores/settings";
import { useAuthStore } from "../src/stores/auth";
import { setAuthHeaderProvider, onUnauthorized } from "../src/services/api/client";
import { OfflineBanner } from "../src/components/common/OfflineBanner";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/* Wire the API client to the session token (kept in SecureStore) and to the
 * 401 handler that clears an expired session. Module scope — no cycles. */
setAuthHeaderProvider(() => {
  const token = useAuthStore.getState().token;
  return { Authorization: token ? `Bearer ${token}` : "" };
});
onUnauthorized(() => {
  void useAuthStore.getState().sessionExpired();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
});

function RootNavigator() {
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          animationDuration: 260
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
        <Stack.Screen name="auth/login" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="auth/register" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="search" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="nxdb" />
        <Stack.Screen name="nxdb/[id]" />
        <Stack.Screen name="publish" options={{ animation: "slide_from_bottom" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    void (async () => {
      await hydrateSettings();
      await initAuth();
      await SplashScreen.hideAsync().catch(() => undefined);
    })();
  }, [hydrateSettings, initAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <View style={{ flex: 1 }}>
            <RootNavigator />
            <OfflineBanner />
          </View>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
