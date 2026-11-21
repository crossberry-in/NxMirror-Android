import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeProvider";

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
}

/** Full-screen translucent overlay for blocking operations (uploads, deletes). */
export function LoadingOverlay({ visible, label }: LoadingOverlayProps) {
  const { colors, dark } = useTheme();
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(140)} style={StyleSheet.absoluteFill} pointerEvents="auto">
      <BlurView intensity={dark ? 34 : 50} tint={dark ? "dark" : "light"} style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
      <View style={styles.center}>
        <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          {label ? <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 26,
    paddingVertical: 22,
    gap: 12,
    alignItems: "center",
    backgroundColor: "rgba(8,11,17,0.6)"
  },
  label: { fontSize: 13, fontWeight: "600" }
});
