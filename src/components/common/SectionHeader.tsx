import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
}

export function SectionHeader({ title, actionLabel, onAction, subtitle }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Text onPress={onAction} style={[styles.action, { color: colors.accent }]} accessibilityRole="button">
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10, marginTop: 4 },
  title: { fontSize: 16.5, fontWeight: "700", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, marginTop: 2 },
  action: { fontSize: 13, fontWeight: "600", paddingBottom: 2 }
});
