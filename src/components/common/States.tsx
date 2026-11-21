import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassButton } from "../glass/GlassButton";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** Friendly empty state with optional action. */
export function EmptyState({ icon, title, message, actionLabel, onAction, compact }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, compact && { paddingVertical: 26 }]}>
      {icon && <View style={[styles.iconWrap, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>{icon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <GlassButton label={actionLabel} variant="primary" onPress={onAction} style={{ marginTop: 16 }} />
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

/** Error state with the API's real error message and a retry action. */
export function ErrorState({ message, onRetry, compact }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, compact && { paddingVertical: 22 }]}>
      <View style={[styles.errorBadge, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
        <Text style={{ color: colors.danger, fontSize: 18, fontWeight: "700" }}>!</Text>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry ? <GlassButton label="Try again" variant="glass" onPress={onRetry} style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 44, paddingHorizontal: 24 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  errorBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  title: { fontSize: 15.5, fontWeight: "700", textAlign: "center" },
  message: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 6, maxWidth: 320 }
});
