import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../glass/GlassCard";
import { ChevronRightIcon, StarIcon } from "../icons";
import { GitRepository } from "../../types/api";
import { formatWhen } from "../../utils/format";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface RepoCardProps {
  repo: GitRepository;
  onPress: () => void;
}

/** Git Cloud repository card with real star count and visibility. */
export function RepoCard({ repo, onPress }: RepoCardProps) {
  const { colors } = useTheme();
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.owner, { color: colors.textMuted }]}>{repo.owner}/</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {repo.name}
          </Text>
          <View
            style={[
              styles.visBadge,
              { backgroundColor: repo.visibility === "public" ? colors.mintSoft : colors.surfaceStrong }
            ]}
          >
            <Text style={[styles.visText, { color: repo.visibility === "public" ? colors.mint : colors.textSecondary }]}>
              {repo.visibility}
            </Text>
          </View>
        </View>
        {repo.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
            {repo.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.starRow}>
            <StarIcon size={12} color={colors.warning} filled />
            <Text style={[styles.meta, { color: colors.textMuted }]}>{repo.stars}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{repo.defaultBranch}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{formatWhen(repo.updatedAt)}</Text>
        </View>
      </View>
      <ChevronRightIcon size={16} color={colors.textMuted} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 2, flexWrap: "wrap" },
  owner: { fontSize: 14, fontWeight: "600" },
  name: { fontSize: 14, fontWeight: "700" },
  visBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1.5, marginLeft: 6 },
  visText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  description: { fontSize: 12.5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { fontSize: 11, fontWeight: "500" }
});
