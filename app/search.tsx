import React, { useEffect, useMemo, useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../src/theme/ThemeProvider";
import { SearchField } from "../src/components/glass/SearchField";
import { GlassCard } from "../src/components/glass/GlassCard";
import { EmptyState, ErrorState } from "../src/components/common/States";
import { SkeletonCard } from "../src/components/common/SkeletonLoader";
import { PackageCard } from "../src/components/registry/PackageCard";
import { FileCard, FolderRow } from "../src/components/files/FileCard";
import { RepoCard } from "../src/components/git/RepoCard";
import { ClockIcon, SearchIcon } from "../src/components/icons";
import { useRegistrySearch } from "../src/hooks/usePackages";
import { useDirectory } from "../src/hooks/useFiles";
import { useRepositories } from "../src/hooks/useGit";
import { useDebouncedValue } from "../src/hooks/useDebouncedValue";
import { useAuthStore } from "../src/stores/auth";
import { useSearchHistoryStore } from "../src/stores/searchHistory";

/**
 * Global search across real backend resources:
 * - Packages: GET /api/registry/search (public)
 * - Files & folders: account index GET /api/mirror?action=list (client-side filter)
 * - Repositories: GET /api/git?action=list (client-side filter)
 */
export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const token = useAuthStore((s) => s.token);

  const [query, setQuery] = useState(typeof params.q === "string" ? params.q : "");
  const debounced = useDebouncedValue(query.trim(), 400);

  const history = useSearchHistoryStore((s) => s.history);
  const addHistory = useSearchHistoryStore((s) => s.add);
  const clearHistory = useSearchHistoryStore((s) => s.clear);
  const hydrateHistory = useSearchHistoryStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateHistory();
  }, [hydrateHistory]);

  useEffect(() => {
    if (debounced.length >= 2) addHistory(debounced);
  }, [debounced, addHistory]);

  const registry = useRegistrySearch({ q: debounced, limit: 12 }, debounced.length >= 1);
  const mirror = useDirectory("", !!token);
  const repos = useRepositories(!!token);

  const lower = debounced.toLowerCase();

  const fileHits = useMemo(
    () => (mirror.data?.files ?? []).filter((file) => file.filename.toLowerCase().includes(lower)).slice(0, 6),
    [mirror.data, lower]
  );
  const folderHits = useMemo(
    () => (mirror.data?.directories ?? []).filter((name) => name.toLowerCase().includes(lower)).slice(0, 4),
    [mirror.data, lower]
  );
  const repoHits = useMemo(
    () => (repos.data?.repositories ?? []).filter((repo) => `${repo.owner}/${repo.name} ${repo.description}`.toLowerCase().includes(lower)).slice(0, 5),
    [repos.data, lower]
  );

  const sections = useMemo(() => {
    const result: Array<{ key: string; title: string; data: React.ReactNode[] }> = [];
    if (registry.data && registry.data.items.length > 0) {
      result.push({
        key: "packages",
        title: `Packages (${registry.data.total})`,
        data: registry.data.items.map((item) => (
          <PackageCard
            key={`pkg-${item.owner}/${item.name}`}
            item={item}
            onPress={() => router.push({ pathname: "/package/[id]", params: { id: `${item.owner}/${item.name}` } })}
          />
        ))
      });
    }
    if (repoHits.length > 0) {
      result.push({
        key: "repos",
        title: `Repositories (${repoHits.length})`,
        data: repoHits.map((repo) => (
          <RepoCard key={`repo-${repo.id}`} repo={repo} onPress={() => router.push({ pathname: "/repository/[id]", params: { id: `${repo.owner}/${repo.name}` } })} />
        ))
      });
    }
    if (folderHits.length > 0) {
      result.push({
        key: "folders",
        title: `Folders (${folderHits.length})`,
        data: folderHits.map((folder) => (
          <FolderRow key={`folder-${folder}`} name={folder} onPress={() => router.push("/(tabs)/files")} />
        ))
      });
    }
    if (fileHits.length > 0) {
      result.push({
        key: "files",
        title: `Files (${fileHits.length})`,
        data: fileHits.map((file) => (
          <FileCard key={`file-${file.id}`} file={file} onPress={() => router.push({ pathname: "/file/[id]", params: { id: file.id, filename: file.filename } })} />
        ))
      });
    }
    return result;
  }, [registry.data, repoHits, folderHits, fileHits, router]);

  const showHistory = debounced.length < 1 && history.length > 0;
  const searching = registry.isFetching || mirror.isLoading || repos.isLoading;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 10 }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search packages, files, folders, repositories…"
          autoFocus
          onClear={() => setQuery("")}
        />
        {showHistory && (
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <ClockIcon size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", marginLeft: 6, flex: 1 }}>Recent searches</Text>
              <Text onPress={clearHistory} style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>
                Clear
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {history.map((term) => (
                <Text
                  key={term}
                  onPress={() => setQuery(term)}
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    overflow: "hidden"
                  }}
                >
                  {term}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>

      {debounced.length >= 1 ? (
        searching && !registry.data ? (
          <View style={{ padding: 16, gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} height={78} />
            ))}
          </View>
        ) : registry.isError ? (
          <ErrorState message={registry.error instanceof Error ? registry.error.message : "Search failed."} onRetry={() => registry.refetch()} />
        ) : sections.length === 0 ? (
          <EmptyState icon={<SearchIcon size={24} color={colors.textMuted} />} title={`No results for “${debounced}”`} message="Nothing matches across packages, your cloud files or Git repositories." />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => `${index}`}
            renderSectionHeader={({ section }) => (
              <Text style={{ color: colors.textMuted, fontSize: 12.5, fontWeight: "700", marginTop: 14, marginBottom: 8, marginHorizontal: 16, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => <View style={{ paddingHorizontal: 16, marginBottom: 2 }}>{item}</View>}
            contentContainerStyle={{ paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
          />
        )
      ) : (
        !showHistory && (
          <View style={{ padding: 24 }}>
            <GlassCard padding={18}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Search NxMirror</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 6, lineHeight: 19 }}>
                Type to search the public package registry. Signed in? Your cloud files, folders and Git repositories are included too.
              </Text>
            </GlassCard>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }
});
