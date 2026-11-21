import React from "react";
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeProvider";
import { glassShadow, radius } from "../../theme/tokens";

interface GlassCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Adds a subtle top-left light sweep for the glass feel. */
  glow?: boolean;
  /** Pressable card with a native-feel opacity response. */
  onPress?: () => void;
  onLongPress?: () => void;
  pressableProps?: Omit<PressableProps, "onPress" | "onLongPress">;
  padding?: number;
}

/** Translucent rounded panel — the base surface of the NxMirror design system. */
export function GlassCard({ children, style, glow = true, onPress, onLongPress, pressableProps, padding = 14 }: GlassCardProps) {
  const { colors, dark } = useTheme();
  const surfaceStyle: StyleProp<ViewStyle> = {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...glassShadow
  };

  const content = (
    <>
      {glow && (
        <LinearGradient
          pointerEvents="none"
          colors={dark ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0)"] : ["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ padding, zIndex: 1 }}>{children}</View>
    </>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        android_ripple={{ color: colors.shimmer, borderless: false, foreground: true }}
        style={({ pressed }) => [surfaceStyle, style, pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 }]}
        {...pressableProps}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[surfaceStyle, style]}>{content}</View>;
}
