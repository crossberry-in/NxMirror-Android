import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { SearchField } from "../../src/components/glass/SearchField";
import { ShieldIcon } from "../../src/components/icons";
import { useAuthStore } from "../../src/stores/auth";

/** Backend rules (netlify/lib/account-auth.mjs): username 3-30 [a-z0-9_], password 8-128. */
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const localError = useMemo(() => {
    if (username && !USERNAME_RE.test(username)) return "Username: 3-30 lowercase letters, numbers or underscores.";
    if (password && password.length < 8) return "Password must be at least 8 characters.";
    if (confirm && confirm !== password) return "Passwords do not match.";
    return null;
  }, [username, password, confirm]);

  const submit = async () => {
    const ok = await register(username.trim().toLowerCase(), password);
    if (ok) router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "android" ? undefined : "padding"} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 30, paddingHorizontal: 20, flex: 1, justifyContent: "center" }}>
        <View style={styles.brandRow}>
          <View style={[styles.logo, { backgroundColor: colors.mintSoft }]}>
            <ShieldIcon size={24} color={colors.mint} />
          </View>
          <Text style={[styles.brand, { color: colors.textPrimary }]}>Create your NxMirror account</Text>
        </View>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          One account unlocks your cloud files, Git repositories, NxDB databases and package publishing. The backend
          provisions your personal storage automatically.
        </Text>

        <GlassCard padding={18} style={{ marginTop: 22 }}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Username</Text>
          <SearchField value={username} onChangeText={setUsername} placeholder="e.g. nova_dev" autoCapitalize="none" />
          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>Password</Text>
          <SearchField value={password} onChangeText={setPassword} placeholder="8+ characters" secureTextEntry autoCapitalize="none" />
          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>Confirm password</Text>
          <SearchField value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry autoCapitalize="none" />
          {localError || error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{localError || error}</Text>
          ) : null}
          <View style={{ marginTop: 18 }}>
            <GlassButton
              label="Create account"
              variant="primary"
              size="lg"
              loading={status === "loading"}
              disabled={!username.trim() || !password || !confirm || !!localError}
              onPress={submit}
              style={{ alignSelf: "stretch", justifyContent: "center" }}
            />
          </View>
        </GlassCard>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Already registered?</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}> Sign in</Text>
          </Pressable>
        </View>
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
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 22 }
});
