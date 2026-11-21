import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "glass" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
}

/** Liquid-glass action button with haptic touch feedback. */
export function GlassButton({
  label,
  onPress,
  variant = "glass",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  style,
  labelStyle,
  haptic = true
}: GlassButtonProps) {
  const { colors } = useTheme();

  const backgrounds: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    glass: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.surfaceBorder },
    danger: { backgroundColor: colors.dangerSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.danger },
    ghost: { backgroundColor: "transparent" }
  };
  const labelColors: Record<string, string> = {
    primary: "#0A0F16",
    glass: colors.textPrimary,
    danger: colors.danger,
    ghost: colors.accent
  };
  const paddings: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 12, paddingVertical: 7 },
    md: { paddingHorizontal: 16, paddingVertical: 11 },
    lg: { paddingHorizontal: 20, paddingVertical: 14 }
  };
  const fontSizes: Record<string, number> = { sm: 12, md: 14, lg: 15 };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        backgrounds[variant],
        paddings[size],
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColors[variant]} />
      ) : (
        <>
          {icon}
          <Text style={[{ color: labelColors[variant], fontSize: fontSizes[size], fontWeight: "600" }, labelStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "flex-start"
  }
});
