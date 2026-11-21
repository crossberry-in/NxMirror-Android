import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { BottomSheet } from "../../src/components/glass/BottomSheet";
import { SearchField } from "../../src/components/glass/SearchField";
import { ScreenHeader } from "../../src/components/common/ScreenHeader";
import { StatusDot } from "../../src/components/common/StatusDot";
import { ConfirmationDialog } from "../../src/components/glass/ConfirmationDialog";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useSettingsStore, ThemeMode } from "../../src/stores/settings";
import { useAuthStore } from "../../src/stores/auth";
import { APP, DEFAULT_API_BASE_URL } from "../../src/constants/config";
import { formatDate } from "../../src/utils/format";

const THEMES: Array<{ key: ThemeMode; label: string }> = [
  { key: "dark", label: "Dark glass" },
  { key: "light", label: "Light" },
  { key: "system", label: "System" }
];

export default function SettingsScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl);
  const resetApiBaseUrl = useSettingsStore((s) => s.resetApiBaseUrl);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const network = useNetworkStatus();

  const [serverSheet, setServerSheet] = useState(false);
  const [serverDraft, setServerDraft] = useState(apiBaseUrl);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const apiState = network.apiReachable === null ? (network.isConnected ? "checking" : "offline") : network.apiReachable ? "online" : "offline";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" subtitle="Preferences are stored on this device only" back />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Profile */}
        <GlassCard padding={16}>
          <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: "700" }}>Profile</Text>
          {user ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
              @{user.username} · member since {formatDate(user.createdAt)}
            </Text>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>Not signed in — public browsing only.</Text>
          )}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {user ? (
              <GlassButton label="Sign out" variant="danger" onPress={() => setConfirmLogout(true)} />
            ) : (
              <GlassButton label="Sign in" variant="primary" onPress={() => router.push("/auth/login")} />
            )}
            <GlassButton label="Profile details" variant="glass" onPress={() => router.push("/(tabs)/account")} />
          </View>
        </GlassCard>

        {/* Theme */}
        <GlassCard padding={16} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: "700" }}>Appearance</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {THEMES.map((theme) => (
              <GlassButton key={theme.key} label={theme.label} variant={themeMode === theme.key ? "primary" : "glass"} onPress={() => setThemeMode(theme.key)} />
            ))}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 10 }}>
            {dark ? "Liquid Glass dark surface active." : "Light glass surface active."}
          </Text>
        </GlassCard>

        {/* API server */}
        <GlassCard padding={16} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: "700" }}>API server</Text>
            <StatusDot state={apiState} label={apiState === "online" ? "Connected" : apiState === "offline" ? "Unreachable" : "Checking…"} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 8 }} numberOfLines={1}>
            {apiBaseUrl}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <GlassButton label="Change server" variant="glass" onPress={() => { setServerDraft(apiBaseUrl); setServerSheet(true); }} />
            {apiBaseUrl !== DEFAULT_API_BASE_URL && <GlassButton label="Reset to official" variant="glass" onPress={resetApiBaseUrl} />}
          </View>
        </GlassCard>

        {/* Network */}
        <GlassCard padding={16} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: "700" }}>Network</Text>
          <View style={styles.kvRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Device connection</Text>
            <Text style={{ color: network.isConnected ? colors.success : colors.danger, fontSize: 13, fontWeight: "700" }}>
              {network.isConnected ? "Online" : "Offline"}
            </Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>NxMirror API probe</Text>
            <Text style={{ color: network.apiReachable ? colors.success : network.apiReachable === false ? colors.danger : colors.warning, fontSize: 13, fontWeight: "700" }}>
              {network.apiReachable === null ? "Checking…" : network.apiReachable ? "Reachable" : "Unreachable"}
            </Text>
          </View>
          <GlassButton label="Re-check now" variant="glass" size="sm" onPress={network.refresh} style={{ marginTop: 10 }} />
        </GlassCard>

        {/* About */}
        <GlassCard padding={16} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: "700" }}>About NxMirror</Text>
          <View style={styles.kvRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>App version</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>{APP.version} (build {APP.build})</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Backend</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>Demoapi</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 10, lineHeight: 17 }}>
            NxMirror Android is the native companion to the NxMirror package registry and cloud — your files, repositories
            and databases stay on your NxMirror account. This app never stores passwords: authentication uses short-lived
            JWT sessions kept in Android Keystore.
          </Text>
        </GlassCard>
      </ScrollView>

      <BottomSheet visible={serverSheet} onClose={() => setServerSheet(false)} title="API server URL" heightRatio={0.4}>
        <SearchField value={serverDraft} onChangeText={setServerDraft} placeholder="https://your-deployment.netlify.app" autoCapitalize="none" />
        <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 10, lineHeight: 17 }}>
          Must be an https:// NxMirror (Demoapi) deployment. The app validates the endpoint with a real /api/db probe.
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <GlassButton
            label="Save"
            variant="primary"
            onPress={() => {
              setApiBaseUrl(serverDraft);
              setServerSheet(false);
              network.refresh();
            }}
          />
          <GlassButton label="Cancel" variant="glass" onPress={() => setServerSheet(false)} />
        </View>
      </BottomSheet>

      <ConfirmationDialog
        visible={confirmLogout}
        title="Sign out?"
        message="Clears the session from this device. Your cloud data remains in your account."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void logout();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }
});
