import React, { useCallback, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { BottomSheet } from "../../src/components/glass/BottomSheet";
import { SearchField } from "../../src/components/glass/SearchField";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { EmptyState, ErrorState } from "../../src/components/common/States";
import { SkeletonCard } from "../../src/components/common/SkeletonLoader";
import { RepoCard } from "../../src/components/git/RepoCard";
import { GitIcon, PlusIcon } from "../../src/components/icons";
import { useRepositories, useGitMutations } from "../../src/hooks/useGit";
import { useAuthStore } from "../../src/stores/auth";

export default function GitScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.user?.username ?? null);

  const [filter, setFilter] = useState("");
  const [createSheet, setCreateSheet] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [error, setError] = useState<string | null>(null);

  const repos = useRepositories(!!token);
  const mutations = useGitMutations("");

  const repositories = useMemo(
    () =>
      (repos.data?.repositories ?? []).filter((repo) =>
        `${repo.owner}/${repo.name} ${repo.description}`.toLowerCase().includes(filter.toLowerCase())
      ),
    [repos.data, filter]
  );

  const onCreate = useCallback(() => {
    setError(null);
    mutations.create.mutate(
      { name: name.trim().toLowerCase(), description: description.trim(), visibility },
      {
        onSuccess: (data) => {
          setCreateSheet(false);
          setName("");
          setDescription("");
          const repo = data.repository;
          if (!data.alreadyExists && repo) {
            router.push({ pathname: "/repository/[id]", params: { id: `${repo.owner}/${repo.name}` } });
          }
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Could not create the repository.")
      }
    );
  }, [mutations.create, name, description, visibility, router]);

  if (!token) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={{ padding: 24, paddingTop: insets.top + 60 }}>
          <EmptyState
            icon={<GitIcon size={26} color={colors.accent} />}
            title="Noxs Git Cloud"
            message="Sign in to create repositories, browse files, commit, fork and star projects in your Git cloud."
            actionLabel="Sign in"
            onAction={() => router.push("/auth/login")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Git Cloud</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {repos.data ? `${repos.data.repositories.length} repositories · yours + public` : "Repositories · commits · forks"}
            </Text>
          </View>
          <GlassButton label="New repo" variant="primary" size="sm" icon={<PlusIcon size={13} color="#0A0F16" />} onPress={() => setCreateSheet(true)} />
        </View>
        <SearchField value={filter} onChangeText={setFilter} placeholder="Search repositories…" onClear={() => setFilter("")} style={{ marginTop: 12 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={repos.isRefetching} onRefresh={() => { repos.refetch(); }} tintColor={colors.accent} progressBackgroundColor={colors.backgroundAlt} />}
      >
        <SectionHeader title="Repositories" subtitle="Sorted by last update" />
        {repos.isLoading ? (
          <View style={{ gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} height={84} />
            ))}
          </View>
        ) : repos.isError ? (
          <ErrorState message={repos.error instanceof Error ? repos.error.message : "Git Cloud unavailable."} onRetry={() => repos.refetch()} />
        ) : repositories.length === 0 ? (
          <EmptyState
            icon={<GitIcon size={26} color={colors.accent} />}
            title={filter ? "No matches" : "No repositories yet"}
            message={filter ? "No repository matches your search." : "Create your first repository — an initial README commit is created automatically."}
            actionLabel={filter ? undefined : "New repository"}
            onAction={filter ? undefined : () => setCreateSheet(true)}
          />
        ) : (
          repositories.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onPress={() => router.push({ pathname: "/repository/[id]", params: { id: `${repo.owner}/${repo.name}` } })}
            />
          ))
        )}
      </ScrollView>

      <BottomSheet visible={createSheet} onClose={() => setCreateSheet(false)} title="New repository" heightRatio={0.52}>
        <SearchField value={name} onChangeText={setName} placeholder="Repository name (letters, numbers, . _ -)" />
        <View style={{ marginTop: 10 }}>
          <SearchField value={description} onChangeText={setDescription} placeholder="Short description (optional)" />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <GlassButton label="Private" variant={visibility === "private" ? "primary" : "glass"} onPress={() => setVisibility("private")} />
          <GlassButton label="Public" variant={visibility === "public" ? "primary" : "glass"} onPress={() => setVisibility("public")} />
        </View>
        {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 10 }}>{error}</Text> : null}
        <View style={{ marginTop: 16 }}>
          <GlassButton label="Create repository" variant="primary" loading={mutations.create.isPending} disabled={!name.trim()} onPress={onCreate} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 3 }
});
