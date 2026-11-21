import React, { useCallback, useEffect, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { SearchField } from "../../src/components/glass/SearchField";
import { StatusDot } from "../../src/components/common/StatusDot";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { EmptyState, ErrorState } from "../../src/components/common/States";
import { Skeleton, SkeletonCard, SkeletonRow } from "../../src/components/common/SkeletonLoader";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { PackageCard } from "../../src/components/registry/PackageCard";
import { FileCard } from "../../src/components/files/FileCard";
import { RepoCard } from "../../src/components/git/RepoCard";
import { CloudIcon, DatabaseIcon, PlusIcon } from "../../src/components/icons";
import { useRegistryStats } from "../../src/hooks/usePackages";
import { useDbOverview } from "../../src/hooks/useNxdb";
import { useDirectory, runChunkedUpload, runDirectUpload } from "../../src/hooks/useFiles";
import { useRepositories } from "../../src/hooks/useGit";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useAuthStore } from "../../src/stores/auth";
import { formatBytes, formatCount, mimeFromFilename } from "../../src/utils/format";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const client = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const stats = useRegistryStats();
  const network = useNetworkStatus();
  const dbOverview = useDbOverview(!!token);
  const mirror = useDirectory("", !!token);
  const repos = useRepositories(!!token);

  const [search, setSearch] = useState("");
  const [upload, setUpload] = useState<{ active: boolean; label: string; loaded: number; total: number }>({
    active: false,
    label: "",
    loaded: 0,
    total: 0
  });

  useEffect(() => {
    client.invalidateQueries({ queryKey: ["nxdb", "overview"] }).catch(() => undefined);
  }, [token, client]);

  const refreshAll = useCallback(() => {
    stats.refetch().catch(() => undefined);
    if (token) {
      mirror.refetch().catch(() => undefined);
      repos.refetch().catch(() => undefined);
      dbOverview.refetch().catch(() => undefined);
    }
    network.refresh();
  }, [stats, mirror, repos, dbOverview, network, token]);

  const pickAndUpload = useCallback(async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const filename = asset.name || "upload.bin";
      const size = asset.size ?? 0;
      setUpload({ active: true, label: `Uploading ${filename}`, loaded: 0, total: Math.max(size, 1) });
      const uploader = size > 0 && size <= 4 * 1024 * 1024
        ? runDirectUpload({
            localUri: asset.uri,
            filename,
            mimeType: asset.mimeType || mimeFromFilename(filename),
            folder: "",
            onProgress: (p) => setUpload((prev) => ({ ...prev, loaded: p.loadedBytes, total: Math.max(p.totalBytes, prev.total) }))
          })
        : runChunkedUpload({
            localUri: asset.uri,
            filename,
            folder: "",
            onProgress: (p) => setUpload((prev) => ({ ...prev, loaded: p.loadedBytes, total: Math.max(p.totalBytes, prev.total) }))
          });
      await uploader;
      setUpload((prev) => ({ ...prev, active: false, label: "Uploaded" }));
      client.invalidateQueries({ queryKey: ["mirror", "list"] }).catch(() => undefined);
    } catch (error) {
      setUpload((prev) => ({ ...prev, active: false, label: error instanceof Error ? error.message : "Upload failed" }));
    }
  }, [token, router, client]);

  const apiState = network.apiReachable === null ? (network.isConnected ? "checking" : "offline") : network.apiReachable ? "online" : "offline";
  const recentPackages = (stats.data?.stats.latest ?? []).slice(0, 4);
  const recentFiles = (mirror.data?.files ?? []).slice(0, 4);
  const recentRepos = (repos.data?.repositories ?? []).slice(0, 3);
  const signedIn = !!token;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 130 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} tintColor={colors.accent} progressBackgroundColor={colors.backgroundAlt} />}
      >
        <View style={styles.padding}>
          {/* Branding */}
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: colors.accentSoft }]}>
              <CloudIcon size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: colors.textPrimary }]}>NxMirror</Text>
              <Text style={[styles.tagline, { color: colors.textMuted }]}>Registry · Cloud · Git · DB</Text>
            </View>
            <StatusDot state={apiState} />
          </View>

          {/* Welcome */}
          <Text style={[styles.welcome, { color: colors.textPrimary }]}>
            {greeting()}
            {user?.username ? `, ${user.username}` : ""}
          </Text>
          <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>
            {signedIn ? "Your NxMirror account is connected." : "Browse the public registry — sign in for your cloud."}
          </Text>

          {/* Global search */}
          <View style={{ marginTop: 14 }}>
            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Search packages, files, repositories…"
              onSubmitEditing={() => {
                if (search.trim()) {
                  router.push({ pathname: "/search", params: { q: search.trim() } });
                  setSearch("");
                }
              }}
            />
          </View>

          {/* Status cards */}
          <View style={styles.statRow}>
            <GlassCard padding={12} style={styles.statCard} onPress={() => router.push("/registry")}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{stats.isLoading ? "—" : formatCount(stats.data?.stats.packages ?? 0)}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Packages</Text>
            </GlassCard>
            <GlassCard padding={12} style={styles.statCard} onPress={() => router.push("/registry")}>
              <Text style={[styles.statValue, { color: colors.mint }]}>{stats.isLoading ? "—" : formatCount(stats.data?.stats.downloads ?? 0)}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Downloads</Text>
            </GlassCard>
            <GlassCard
              padding={12}
              style={styles.statCard}
              onPress={() => (signedIn ? router.push("/nxdb") : router.push("/auth/login"))}
            >
              <View style={[styles.statIconRow]}>
                <DatabaseIcon size={13} color={colors.accent} />
                <Text style={[styles.statValueSmall, { color: colors.textPrimary }]}>
                  {signedIn && !dbOverview.isLoading ? formatBytes(dbOverview.data?.overview.storageBytes ?? 0) : signedIn ? "…" : "Sign in"}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>DB storage</Text>
            </GlassCard>
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <GlassButton
              label="Upload file"
              variant="primary"
              icon={<PlusIcon size={15} color="#0A0F16" />}
              onPress={pickAndUpload}
            />
            <GlassButton label="Git cloud" variant="glass" onPress={() => router.push("/(tabs)/git")} />
            <GlassButton label="Registry" variant="glass" onPress={() => router.push("/(tabs)/registry")} />
          </View>
        </View>

        {/* Recent packages */}
        <View style={styles.section}>
          <SectionHeader
            title="Latest packages"
            subtitle={stats.data ? `${formatCount(stats.data.stats.maintainers)} maintainers · updated ${formatCount(stats.data.stats.versions)} versions` : undefined}
            actionLabel="See all"
            onAction={() => router.push("/(tabs)/registry")}
          />
          {stats.isLoading ? (
            <View style={{ gap: 10 }}>
              <SkeletonCard height={78} />
              <SkeletonCard height={78} />
            </View>
          ) : stats.isError ? (
            <ErrorState message={stats.error instanceof Error ? stats.error.message : "Registry unavailable."} onRetry={() => stats.refetch()} compact />
          ) : recentPackages.length === 0 ? (
            <EmptyState
              compact
              title="No packages yet"
              message="The public registry is empty. Published artifacts appear here instantly."
              actionLabel="Open registry"
              onAction={() => router.push("/(tabs)/registry")}
            />
          ) : (
            recentPackages.map((item) => (
              <PackageCard
                key={`${item.owner}/${item.name}`}
                item={item}
                onPress={() => router.push({ pathname: "/package/[id]", params: { id: `${item.owner}/${item.name}` } })}
              />
            ))
          )}
        </View>

        {/* Recent files */}
        {signedIn && (
          <View style={styles.section}>
            <SectionHeader title="Recently uploaded" subtitle="From your cloud files" actionLabel="Manage" onAction={() => router.push("/(tabs)/files")} />
            {mirror.isLoading ? (
              <View style={{ gap: 8 }}>
                <SkeletonRow />
                <SkeletonRow />
              </View>
            ) : mirror.isError ? (
              <ErrorState message={mirror.error instanceof Error ? mirror.error.message : "Cloud files unavailable."} onRetry={() => mirror.refetch()} compact />
            ) : mirror.data?.partial ? (
              <EmptyState compact title="Cloud storage offline" message={mirror.data.warning ?? "AnonDrop upstream is temporarily unavailable — showing your saved NxMirror files."} />
            ) : recentFiles.length === 0 ? (
              <EmptyState compact title="No files yet" message="Upload your first file to see it here." actionLabel="Upload" onAction={pickAndUpload} />
            ) : (
              recentFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPress={() => router.push({ pathname: "/file/[id]", params: { id: file.id, filename: file.filename } })}
                />
              ))
            )}
          </View>
        )}

        {/* Repositories */}
        {signedIn && (
          <View style={styles.section}>
            <SectionHeader title="Git repositories" subtitle="Noxs Git Cloud" actionLabel="Open" onAction={() => router.push("/(tabs)/git")} />
            {repos.isLoading ? (
              <View style={{ gap: 10 }}>
                <SkeletonCard height={72} />
                <SkeletonCard height={72} />
              </View>
            ) : repos.isError ? (
              <ErrorState message={repos.error instanceof Error ? repos.error.message : "Git Cloud unavailable."} onRetry={() => repos.refetch()} compact />
            ) : recentRepos.length === 0 ? (
              <EmptyState compact title="No repositories" message="Create your first repository in the Git tab." actionLabel="Open Git" onAction={() => router.push("/(tabs)/git")} />
            ) : (
              recentRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onPress={() => router.push({ pathname: "/repository/[id]", params: { id: `${repo.owner}/${repo.name}` } })} />
              ))
            )}
          </View>
        )}

        {!signedIn && (
          <View style={styles.section}>
            <GlassCard padding={18}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Connect your account</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 6, lineHeight: 19 }}>
                Sign in to unlock your personal cloud files, Git repositories, NxDB databases and publishing.
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <GlassButton label="Sign in" variant="primary" onPress={() => router.push("/auth/login")} />
                <GlassButton label="Create account" variant="glass" onPress={() => router.push("/auth/register")} />
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      <LoadingOverlay
        visible={upload.active}
        label={
          upload.total > 0
            ? `${upload.label} — ${Math.round((upload.loaded / upload.total) * 100)}%`
            : upload.label || "Working…"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padding: { paddingHorizontal: 16 },
  section: { paddingHorizontal: 16, marginTop: 22 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  tagline: { fontSize: 11, marginTop: 1 },
  welcome: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5, marginTop: 20 },
  welcomeSub: { fontSize: 13, marginTop: 4 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  statCard: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statValueSmall: { fontSize: 13.5, fontWeight: "700" },
  statIconRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statLabel: { fontSize: 10.5, marginTop: 3, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" }
});
