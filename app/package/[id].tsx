import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { ScreenHeader, DetailScreen, MetaRow } from "../../src/components/common/ScreenHeader";
import { Skeleton, SkeletonSection } from "../../src/components/common/SkeletonLoader";
import { ErrorState } from "../../src/components/common/States";
import { CopyIcon, DownloadIcon, PackageIcon } from "../../src/components/icons";
import { usePackage } from "../../src/hooks/usePackages";
import { useAuthStore } from "../../src/stores/auth";
import { packageDownloadUrl } from "../../src/services/api/registry";
import { formatBytes, formatCount, formatDate, formatWhen } from "../../src/utils/format";

/** Package detail — real catalog data from GET /api/registry/package/:owner/:name */
export default function PackageDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? "");
  const token = useAuthStore((s) => s.token);

  const detail = usePackage(id);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.user?.username ?? null);

  const pkg = detail.data?.package;
  const versions = detail.data?.versions ?? [];

  const installCommand = useMemo(() => {
    if (!pkg) return "";
    const base = packageDownloadUrl(pkg.owner, pkg.name).replace(/^https?:\/\//, "");
    return `npm install ${base} --save`;
  }, [pkg]);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader title={pkg ? `${pkg.owner}/${pkg.name}` : "Package"} subtitle={pkg ? `v${pkg.version} · ${pkg.type}` : undefined} back />

      {detail.isLoading ? (
        <View style={{ padding: 16 }}>
          <Skeleton width="40%" height={18} />
          <View style={{ marginTop: 16 }}>
            <SkeletonSection rows={4} />
          </View>
        </View>
      ) : detail.isError || !pkg ? (
        <ErrorState message={String((detail.error as Error | null)?.message ?? "Package unavailable.")} onRetry={() => detail.refetch()} />
      ) : (
        <DetailScreen>
          <View style={{ paddingHorizontal: 16 }}>
            <MetaRow
              items={[
                { label: "Version", value: `v${pkg.version}`, color: colors.accent },
                { label: "Downloads", value: formatCount(pkg.downloads) },
                { label: "Size", value: formatBytes(pkg.size) },
                { label: "License", value: pkg.license || "—" }
              ]}
            />

            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: pkg.type === "plugin" ? colors.mintSoft : colors.accentSoft }]}>
                  <PackageIcon size={20} color={pkg.type === "plugin" ? colors.mint : colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>{pkg.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    by {pkg.owner} · published {formatWhen(pkg.publishedAt)}
                    {pkg.visibility === "private" ? " · private" : ""}
                  </Text>
                </View>
              </View>
              {pkg.description ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginTop: 12 }}>{pkg.description}</Text>
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 12, fontStyle: "italic" }}>No description provided.</Text>
              )}
              {pkg.tags.length > 0 && (
                <View style={styles.tagWrap}>
                  {pkg.tags.map((tag) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>

            {/* Install */}
            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>Install</Text>
              <View style={[styles.commandBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
                <Text style={{ color: colors.accent, fontSize: 12, fontFamily: "monospace" }} selectable>
                  {installCommand}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <GlassButton
                  label="Copy install command"
                  variant="glass"
                  icon={<CopyIcon size={13} color={colors.accent} />}
                  onPress={async () => {
                    await Clipboard.setStringAsync(installCommand);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
                    setNotice("Install command copied");
                  }}
                />
                <GlassButton
                  label="Download artifact"
                  variant="primary"
                  icon={<DownloadIcon size={13} color="#0A0F16" />}
                  onPress={async () => {
                    setBusy("download");
                    try {
                      const url = packageDownloadUrl(pkg.owner, pkg.name, pkg.version);
                      const target = `${FileSystem.cacheDirectory}${pkg.filename || `${pkg.name}-${pkg.version}.tgz`}`;
                      const result = await FileSystem.downloadAsync(url, target);
                      if (result.status >= 200 && result.status < 300 && (await Sharing.isAvailableAsync())) {
                        await Sharing.shareAsync(result.uri, { dialogTitle: pkg.filename, mimeType: "application/gzip" });
                      } else {
                        setNotice(`Downloaded (${formatBytes(pkg.size)}) — saved in cache`);
                      }
                    } catch (error) {
                      setNotice(error instanceof Error ? error.message : "Download failed");
                    } finally {
                      setBusy(null);
                    }
                  }}
                />
              </View>
            </GlassCard>

            {/* Versions */}
            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>
                Versions ({versions.length})
              </Text>
              <View style={{ marginTop: 8 }}>
                {versions.slice(0, 12).map((version) => (
                  <View key={version.version} style={[styles.versionRow, { borderBottomColor: colors.surfaceBorder }]}>
                    <Text style={{ color: version.version === pkg.version ? colors.accent : colors.textPrimary, fontSize: 13, fontWeight: version.version === pkg.version ? "700" : "500" }}>
                      v{version.version}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatBytes(version.size)}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 10 }}>{formatWhen(version.publishedAt)}</Text>
                    <Text
                      onPress={async () => {
                        await Clipboard.setStringAsync(packageDownloadUrl(pkg.owner, pkg.name, version.version));
                        setNotice(`v${version.version} download URL copied`);
                      }}
                      style={{ color: colors.accent, fontSize: 11, fontWeight: "700", marginLeft: 10 }}
                    >
                      copy
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Readme */}
            <GlassCard padding={16} style={{ marginTop: 12, marginBottom: 30 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>Readme</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
                {pkg.readme?.trim() ? pkg.readme : "This package has no readme. The publisher can add one when publishing with metadata."}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 12 }}>
                Published {formatDate(pkg.publishedAt)} · sha256 {pkg.sha256 ? pkg.sha256.slice(0, 16) : "—"}…
              </Text>
            </GlassCard>

            {notice ? <Text style={{ color: colors.mint, fontSize: 12, textAlign: "center", marginBottom: 10 }}>{notice}</Text> : null}

            {/* Owner actions (real backend capability: immutable store — re-publish as new versions) */}
            {token && currentUser && pkg.owner === currentUser && (
              <GlassCard padding={16} style={{ marginBottom: 30 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>Owner actions</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
                  Versions are immutable on the server. Publish a new version instead of deleting.
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <GlassButton label="Publish new version" variant="primary" onPress={() => router.push("/publish")} />
                </View>
              </GlassCard>
            )}
          </View>
        </DetailScreen>
      )}

      <LoadingOverlay visible={busy === "download"} label="Downloading artifact…" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 4 },
  commandBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 10 },
  versionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth }
});
