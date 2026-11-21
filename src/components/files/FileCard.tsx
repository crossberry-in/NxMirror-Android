import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../glass/GlassCard";
import { FileIcon, FolderIcon } from "../icons";
import { MirrorFile } from "../../types/api";
import { fileKind, formatBytes, formatWhen } from "../../utils/format";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface FileCardProps {
  file: MirrorFile;
  onPress: () => void;
  onLongPress?: () => void;
}

const KIND_COLORS: Record<string, string> = {
  image: "#C084FC",
  video: "#F472B6",
  audio: "#FBBF24",
  pdf: "#FB7185",
  archive: "#38BDF8",
  code: "#4EDEA3",
  text: "#89CEFF",
  other: "#94A3B8"
};

/** Cloud file card — the filename, type badge and real timestamps. */
export function FileCard({ file, onPress, onLongPress }: FileCardProps) {
  const { colors } = useTheme();
  const kind = fileKind(file.filename);
  const color = KIND_COLORS[kind] || colors.textMuted;
  return (
    <GlassCard onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${color}1E` }]}>
        <FileIcon size={17} color={color} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {file.filename}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color }]}>{kind.toUpperCase()}</Text>
          {typeof file.size === "number" && file.size > 0 ? (
            <Text style={[styles.meta, { color: colors.textMuted }]}>{formatBytes(file.size)}</Text>
          ) : null}
          {file.createdAt ? (
            <Text style={[styles.meta, { color: colors.textMuted }]}>{formatWhen(file.createdAt)}</Text>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

interface FolderRowProps {
  name: string;
  onPress: () => void;
}

export function FolderRow({ name, onPress }: FolderRowProps) {
  const { colors } = useTheme();
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: colors.accentSoft }]}>
        <FolderIcon size={17} color={colors.accent} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Folder</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  iconBox: { width: 34, height: 34, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, marginLeft: 12, gap: 3 },
  name: { fontSize: 13.5, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  meta: { fontSize: 11, fontWeight: "500" }
});
