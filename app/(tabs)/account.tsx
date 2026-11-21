import React from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { ConfirmationDialog } from "../../src/components/glass/ConfirmationDialog";
import { Skeleton, SkeletonRow } from "../../src/components/common/SkeletonLoader";
import { EmptyState } from "../../src/components/common/States";
import { ChevronRightIcon, CloudIcon, DatabaseIcon, PackageIcon, SettingsIcon, ShieldIcon, UserIcon } from "../../src/components/icons";
import { useAuthStore } from "../../src/stores/auth";
import { useMirrorProfile } from "../../src/hooks/useFiles";
import { useDatabases } from "../../src/hooks/useNxdb";
import { formatDate } from "../../src/utils/format";
import { useState } from "react";

interface MenuRow {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function AccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);

  const profile = useMirrorProfile(!!token);
  const databases = useDatabases(!!token);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const displayName = profile.data?.profile.displayName || user?.username || "NxMirror user";
  const bio = profile.data?.profile.bio;
  const avatar = profile.data?.profile.avatarData;

  if (status === "hydrating") {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={{ padding: 20, paddingTop: insets.top + 24, gap: 14 }}>
          <Skeleton width={120} height={20} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={16} />
        </View>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={{ padding: 24, paddingTop: insets.top + 60 }}>
          <EmptyState
            icon={<UserIcon size={26} color={colors.accent} />}
            title="Account"
            message="Sign in to sync your cloud files, Git repositories, packages and databases — or create a new NxMirror account in seconds."
            actionLabel="Sign in"
            onAction={() => router.push("/auth/login")}
          />
          <View style={{ alignItems: "center" }}>
            <GlassButton label="Create account" variant="glass" onPress={() => router.push("/auth/register")} />
          </View>
        </View>
      </View>
    );
  }

  const menu: MenuRow[] = [
    {
      icon: <CloudIcon size={17} color={colors.accent} />,
      label: "Cloud files",
      hint: "Browse, upload and manage files",
      onPress: () => router.push("/(tabs)/files")
    },
    {
      icon: <PackageIcon size={17} color={colors.mint} />,
      label: "My packages",
      hint: "Artifacts you published",
      onPress: () => router.push("/publish")
    },
    {
      icon: <DatabaseIcon size={17} color={colors.accent} />,
      label: "NxMirror DB",
      hint: databases.data ? `${databases.data.databases.length} databases` : "Databases, tables and SQL",
      onPress: () => router.push("/nxdb")
    },
    {
      icon: <SettingsIcon size={17} color={colors.textSecondary} />,
      label: "Settings",
      hint: "Theme, API server, about",
      onPress: () => router.push("/settings")
    },
    {
      icon: <ShieldIcon size={17} color={colors.textSecondary} />,
      label: "API tokens",
      hint: "Connect Noxs and other tools",
      onPress: () => router.push("/settings")
    },
    {
      icon: <ChevronRightIcon size={17} color={colors.danger} />,
      label: "Sign out",
      hint: "Clears the secure session on this device",
      destructive: true,
      onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
        setConfirmLogout(true);
      }
    }
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Account</Text>
          <GlassCard padding={18} style={{ marginTop: 14 }}>
            <View style={styles.profileRow}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
                  <UserIcon size={24} color={colors.accent} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "800" }}>{displayName}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 2 }}>
                  @{user?.username ?? "…"} · joined {formatDate(user?.createdAt)}
                </Text>
              </View>
            </View>
            {bio ? <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 12 }}>{bio}</Text> : null}
          </GlassCard>

          <View style={{ marginTop: 18, gap: 10 }}>
            {menu.map((row) => (
              <GlassCard
                key={row.label}
                padding={14}
                glow={false}
                onPress={row.onPress}
                style={row.destructive ? { borderColor: colors.danger } : undefined}
              >
                <View style={styles.menuRow}>
                  {row.icon}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: row.destructive ? colors.danger : colors.textPrimary, fontSize: 14.5, fontWeight: "600" }}>{row.label}</Text>
                    {row.hint ? <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>{row.hint}</Text> : null}
                  </View>
                  {!row.destructive && <ChevronRightIcon size={15} color={colors.textMuted} />}
                </View>
              </GlassCard>
            ))}
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 18, textAlign: "center" }}>
            Session token stored in Android Keystore via Expo SecureStore.
          </Text>
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={confirmLogout}
        title="Sign out?"
        message="Your session will be cleared from this device. Cloud data stays safe in your NxMirror account."
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
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  menuRow: { flexDirection: "row", alignItems: "center" }
});
