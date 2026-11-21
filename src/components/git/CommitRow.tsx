import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { GitCommit } from "../../types/api";
import { formatWhen } from "../../utils/format";

interface CommitRowProps {
  commit: GitCommit;
}

export function CommitRow({ commit }: CommitRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { borderBottomColor: colors.surfaceBorder }]}>
      <View style={[styles.dot, { borderColor: colors.accent }]} />
      <View style={styles.body}>
        <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={2}>
          {commit.message}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {commit.kind ? `${commit.kind} · ` : ""}
          {commit.author ? `${commit.author} · ` : ""}
          {formatWhen(commit.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 10, height: 10, borderRadius: 6, borderWidth: 2, marginTop: 4 },
  body: { flex: 1, gap: 3 },
  message: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  meta: { fontSize: 11 }
});
