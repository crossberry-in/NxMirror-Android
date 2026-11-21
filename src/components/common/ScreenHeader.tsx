import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../theme/ThemeProvider";
import { GlassCard } from "../glass/GlassCard";
import { ChevronLeftIcon } from "../icons";
import { Pressable, ScrollView } from "react-native";

/** Simple screen header used across detail screens (no native headers). */
export function ScreenHeader({
  title,
  subtitle,
  back = true,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      // Android hardware back is handled by expo-router automatically.
      return undefined;
    }, [])
  );

  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12 }}>
      <View style={styles.row}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={10} style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.7 : 1 }]}>
            <ChevronLeftIcon size={18} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function DetailScreen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
        {children}
      </ScrollView>
    </View>
  );
}

export function MetaRow({ items }: { items: Array<{ label: string; value: string; color?: string }> }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metaGrid}>
      {items.map((item) => (
        <GlassCard key={item.label} padding={10} glow={false} style={{ flex: 1, minWidth: 100 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</Text>
          <Text style={{ color: item.color || colors.textPrimary, fontSize: 13, fontWeight: "700", marginTop: 3 }} numberOfLines={2}>
            {item.value}
          </Text>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 19, fontWeight: "800", letterSpacing: -0.3, flexShrink: 1 },
  subtitle: { fontSize: 12, marginTop: 1 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }
});
