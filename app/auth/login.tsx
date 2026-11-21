import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { SearchField } from "../../src/components/glass/SearchField";
import { CloudIcon } from "../../src/components/icons";
import { useAuthStore } from "../../src/stores/auth";

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const ok = await login(username.trim().toLowerCase(), password);
    if (ok) {
      if (params.redirect && typeof params.redirect === "string") {
        router.replace(params.redirect as never);
      } else {
        router.back();
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "android" ? undefined : "padding"} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 30, paddingHorizontal: 20, flex: 1, justifyContent: "center" }}>
        <View style={styles.brandRow}>
          <View style={[styles.logo, { backgroundColor: colors.accentSoft }]}>
            <CloudIcon size={26} color={colors.accent} />
          </View>
          <Text style={[styles.brand, { color: colors.textPrimary }]}>Sign in to NxMirror</Text>
        </View>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Your session token is stored encrypted in Android Keystore — never in plain storage.
        </Text>

        <GlassCard padding={18} style={{ marginTop: 22 }}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Username</Text>
          <SearchField value={username} onChangeText={setUsername} placeholder="lowercase username" autoCapitalize="none" />
          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>Password</Text>
          <SearchField value={password} onChangeText={setPassword} placeholder="8+ characters" secureTextEntry autoCapitalize="none" />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <View style={{ marginTop: 18 }}>
            <GlassButton label="Sign in" variant="primary" size="lg" loading={status === "loading"} disabled={!username.trim() || !password} onPress={submit} style={{ alignSelf: "stretch", justifyContent: "center" }} />
          </View>
        </GlassCard>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>New to NxMirror?</Text>
          <Pressable onPress={() => router.push("/auth/register")} hitSlop={8}>
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}> Create account</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Continue browsing without an account</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 21, fontWeight: "800", letterSpacing: -0.4, flex: 1, flexWrap: "wrap" },
  sub: { fontSize: 12.5, lineHeight: 19, marginTop: 14 },
  fieldLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 },
  error: { fontSize: 12.5, marginTop: 12, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
  backRow: { alignItems: "center", marginTop: 18 }
});
