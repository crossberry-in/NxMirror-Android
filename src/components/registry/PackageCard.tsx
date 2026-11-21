import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../glass/GlassCard";
import { PackageIcon } from "../icons";
import { RegistryPackage } from "../../types/api";
import { formatBytes, formatCount, formatWhen } from "../../utils/format";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface PackageCardProps {
  item: RegistryPackage;
  onPress: () => void;
}

/** Registry package card — real metadata from the NxMirror catalog. */
export function PackageCard({ item, onPress }: PackageCardProps) {
  const { colors } = useTheme();
  const isPlugin = item.type === "plugin";
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: isPlugin ? colors.mintSoft : colors.accentSoft }]}>
        <PackageIcon size={18} color={isPlugin ? colors.mint : colors.accent} />
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.owner, { color: colors.textMuted }]}>{item.owner}/</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.visibility === "private" && (
            <View style={[styles.visBadge, { backgroundColor: colors.warning, opacity: 0.85 }]}>
              <Text style={styles.visText}>private</Text>
            </View>
          )}
        </View>
        {item.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.accent }]}>v{item.version}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{formatCount(item.downloads)} downloads</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{formatBytes(item.size)}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{formatWhen(item.publishedAt)}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  cardGap: {},
  iconBox: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, marginLeft: 12, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  owner: { fontSize: 14, fontWeight: "600" },
  name: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  visBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 },
  visText: { color: "#1A1300", fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  description: { fontSize: 12.5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2, flexWrap: "wrap" },
  meta: { fontSize: 11, fontWeight: "500" }
});
