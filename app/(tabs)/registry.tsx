import React, { useCallback, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/theme/ThemeProvider";
import { SearchField } from "../../src/components/glass/SearchField";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { EmptyState, ErrorState } from "../../src/components/common/States";
import { SkeletonCard } from "../../src/components/common/SkeletonLoader";
import { PackageCard } from "../../src/components/registry/PackageCard";
import { PlusIcon } from "../../src/components/icons";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { useRegistrySearch, useRegistryStats } from "../../src/hooks/usePackages";
import { useAuthStore } from "../../src/stores/auth";
import { formatCount } from "../../src/utils/format";

type Kind = "all" | "package" | "plugin";
type Sort = "downloads" | "newest" | "name";

const KINDS: Array<{ key: Kind; label: string }> = [
  { key: "all", label: "All" },
  { key: "package", label: "Packages" },
  { key: "plugin", label: "Plugins" }
];
const SORTS: Array<{ key: Sort; label: string }> = [
  { key: "downloads", label: "Popular" },
  { key: "newest", label: "Newest" },
  { key: "name", label: "A → Z" }
];

export default function RegistryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tag?: string }>();
  const token = useAuthStore((s) => s.token);

  const [query, setQuery] = useState(params.tag ?? "");
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("downloads");

  useFocusEffect(
    useCallback(() => {
      if (params.tag) setQuery(String(params.tag));
    }, [params.tag])
  );

  const search = useRegistrySearch({ q: query.trim(), kind, sort, limit: 40 });
  const stats = useRegistryStats();

  const items = useMemo(() => search.data?.items ?? [], [search.data]);
  const chips = useMemo(() => search.data?.tags?.slice(0, 10) ?? [], [search.data]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Package Registry</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {stats.data ? `${formatCount(stats.data.stats.packages)} packages · ${formatCount(stats.data.stats.plugins)} plugins · no login to install` : "Public npm-like registry"}
            </Text>
          </View>
          <GlassButton
            label="Publish"
            variant="primary"
            size="sm"
            icon={token ? <PlusIcon size={13} color="#0A0F16" /> : undefined}
            onPress={() => router.push(token ? "/publish" : "/auth/login")}
          />
        </View>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search packages and plugins…"
          onClear={() => setQuery("")}
          style={{ marginTop: 12 }}
        />

        <View style={styles.chipRow}>
          {KINDS.map((chip) => (
            <Chip key={chip.key} label={chip.label} active={kind === chip.key} onPress={() => setKind(chip.key)} />
          ))}
          <View style={styles.divider} />
          {SORTS.map((chip) => (
            <Chip key={chip.key} label={chip.label} active={sort === chip.key} onPress={() => setSort(chip.key)} muted />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={search.isRefetching} onRefresh={() => { search.refetch(); }} tintColor={colors.accent} progressBackgroundColor={colors.backgroundAlt} />
        }
      >
        {!search.isLoading && chips.length > 0 && !query.trim() && (
          <View style={styles.tagWrap}>
            {chips.map((tag) => (
              <Chip key={tag.tag} label={`#${tag.tag} (${tag.count})`} muted active={query === tag.tag} onPress={() => setQuery(tag.tag)} />
            ))}
          </View>
        )}

        {search.isLoading ? (
          <View style={{ gap: 10, paddingTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} height={80} />
            ))}
          </View>
        ) : search.isError ? (
          <ErrorState message={search.error instanceof Error ? search.error.message : "Registry search failed."} onRetry={() => search.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={query.trim() ? `No results for “${query.trim()}”` : "Registry is empty"}
            message={query.trim() ? "Try different keywords, or publish the first package with this name." : "Published public artifacts appear here. Publish yours with the button above."}
            actionLabel={query.trim() ? "Clear search" : undefined}
            onAction={query.trim() ? () => setQuery("") : undefined}
          />
        ) : (
          <>
            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {formatCount(search.data?.total ?? 0)} {search.data?.total === 1 ? "result" : "results"}
              {query.trim() ? ` for “${query.trim()}”` : ""}
            </Text>
            {items.map((item) => (
              <PackageCard
                key={`${item.owner}/${item.name}`}
                item={item}
                onPress={() => router.push({ pathname: "/package/[id]", params: { id: `${item.owner}/${item.name}` } })}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress, muted }: { label: string; active: boolean; onPress: () => void; muted?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.chip,
        {
          backgroundColor: active ? (muted ? colors.mintSoft : colors.accentSoft) : colors.surface,
          color: active ? (muted ? colors.mint : colors.accent) : colors.textSecondary,
          borderColor: active ? (muted ? colors.mint : colors.accent) : colors.surfaceBorder
        }
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 3 },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  divider: { width: StyleSheet.hairlineWidth, height: 18, backgroundColor: "#5A6474", marginHorizontal: 2 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    fontSize: 12,
    fontWeight: "600",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: "hidden"
  },
  resultCount: { fontSize: 12, marginBottom: 10, marginTop: 4 }
});
