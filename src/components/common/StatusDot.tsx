import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

interface StatusDotProps {
  state: "online" | "offline" | "checking";
  label?: string;
}

/** Small live status indicator — reflects a real probe, never a guess. */
export function StatusDot({ state, label }: StatusDotProps) {
  const { colors } = useTheme();
  const color = state === "online" ? colors.success : state === "offline" ? colors.danger : colors.warning;
  const text = label ?? (state === "online" ? "API online" : state === "offline" ? "API unreachable" : "Checking API…");
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={[styles.dot, { backgroundColor: color }, state === "checking" && styles.pulse]} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pulse: { opacity: 0.7 },
  text: { fontSize: 11, fontWeight: "600" }
});
