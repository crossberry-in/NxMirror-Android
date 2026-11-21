import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { ScreenHeader, DetailScreen, MetaRow } from "../../src/components/common/ScreenHeader";
import { ErrorState } from "../../src/components/common/States";
import { CopyIcon, DownloadIcon, EyeIcon } from "../../src/components/icons";
import { useDirectory } from "../../src/hooks/useFiles";
import { useAuthStore } from "../../src/stores/auth";
import { mirrorFileUrl } from "../../src/services/api/files";
import { downloadAndShare } from "../../src/utils/download";
import { fileKind, formatBytes, formatDate, isReadableTextMime, mimeFromFilename } from "../../src/utils/format";
import { MirrorFile } from "../../src/types/api";

/**
 * File detail — resolves the real record from the account's directory index
 * (GET /api/mirror?action=list) and streams downloads through the public
 * NxMirror URL: <origin>/<fileId>/<filename>.
 */
export default function FileDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string; filename?: string }>();
  const id = String(params.id ?? "");
  const token = useAuthStore((s) => s.token);
  const root = useDirectory("", !!token);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const files = root.data?.files ?? [];
  const file: MirrorFile | undefined = files.find((item) => item.id === id);
  const filename = file?.filename ?? (typeof params.filename === "string" ? params.filename : id);
  const url = mirrorFileUrl(id, filename);
  const kind = fileKind(filename);
  const mime = mimeFromFilename(filename);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader title={filename} subtitle={kind.toUpperCase()} back />
      {!token ? (
        <ErrorState message="Sign in to view your cloud files." />
      ) : root.isLoading ? (
        <View style={{ padding: 20, gap: 10 }}>
          <View style={{ height: 180, borderRadius: 16, backgroundColor: colors.skeleton }} />
        </View>
      ) : root.isError ? (
        <ErrorState message={root.error instanceof Error ? root.error.message : "Cloud index unavailable."} onRetry={() => root.refetch()} />
      ) : !file ? (
        <ErrorState message="This file is no longer in your cloud index (it may have been deleted or uploaded from another device session)." onRetry={() => root.refetch()} />
      ) : (
        <DetailScreen>
          <View style={{ paddingHorizontal: 16 }}>
            <MetaRow
              items={[
                { label: "Type", value: kind.toUpperCase(), color: colors.accent },
                { label: "Size", value: typeof file.size === "number" && file.size > 0 ? formatBytes(file.size) : "—" },
                { label: "Folder", value: file.folder || "root" },
                { label: "Uploaded", value: file.createdAt ? formatDate(file.createdAt) : "—" }
              ]}
            />

            {(kind === "image") && (
              <GlassCard padding={10} style={{ marginTop: 12 }}>
                <Image source={{ uri: url }} style={styles.preview} resizeMode="contain" />
              </GlassCard>
            )}

            {isReadableTextMime(mime) && (
              <GlassCard padding={16} style={{ marginTop: 12 }}>
                <View style={styles.sectionTitleRow}>
                  <EyeIcon size={15} color={colors.accent} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700", marginLeft: 8 }}>Text content</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 10, lineHeight: 19 }}>
                  Open the NxMirror URL in a browser for an inline text preview — large files stream directly from your domain.
                </Text>
              </GlassCard>
            )}

            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>Share & download</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 8 }} numberOfLines={2}>
                {url}
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <GlassButton
                  label="Copy NxMirror URL"
                  variant="glass"
                  icon={<CopyIcon size={13} color={colors.accent} />}
                  onPress={async () => {
                    await Clipboard.setStringAsync(url);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
                    setNotice("NxMirror URL copied");
                  }}
                />
                <GlassButton
                  label="Download"
                  variant="primary"
                  icon={<DownloadIcon size={13} color="#0A0F16" />}
                  onPress={async () => {
                    setBusy(true);
                    setNotice(null);
                    try {
                      await downloadAndShare({ url, filename });
                      setNotice("Saved via share sheet");
                    } catch (error) {
                      setNotice(error instanceof Error ? error.message : "Download failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </View>
              {notice ? <Text style={{ color: colors.mint, fontSize: 12, marginTop: 10 }}>{notice}</Text> : null}
            </GlassCard>
          </View>
        </DetailScreen>
      )}
      <LoadingOverlay visible={busy} label="Downloading…" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  preview: { width: "100%", height: 240, borderRadius: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center" }
});
