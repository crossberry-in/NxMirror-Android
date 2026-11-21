import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { ScreenHeader } from "../../src/components/common/ScreenHeader";
import { EmptyState, ErrorState } from "../../src/components/common/States";
import { SkeletonCard } from "../../src/components/common/SkeletonLoader";
import { ChevronRightIcon, DatabaseIcon } from "../../src/components/icons";
import { useDatabases, useDbOverview, useDbService } from "../../src/hooks/useNxdb";
import { useAuthStore } from "../../src/stores/auth";
import { formatBytes, formatCount, formatDate } from "../../src/utils/format";

/** NxMirror DB (NxDB) — databases owned by the signed-in account. */
export default function NxDbHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const service = useDbService();
  const databases = useDatabases(!!token);
  const overview = useDbOverview(!!token);

  if (!token) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="NxMirror DB" subtitle="Cloud databases (SQLite & NoSQL)" back />
        <View style={{ padding: 24, paddingTop: 30 }}>
          <EmptyState
            icon={<DatabaseIcon size={26} color={colors.accent} />}
            title="Sign in to use NxDB"
            message="NxDB databases belong to your NxMirror account. Sign in to list databases, browse tables and run SQL."
            actionLabel="Sign in"
            onAction={() => router.push("/auth/login")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="NxMirror DB" subtitle={service.data ? `${service.data.name} · engines: ${service.data.engines.join(", ")}` : "Cloud database service"} back />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {overview.isLoading ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard height={90} />
            <SkeletonCard height={90} />
            <SkeletonCard height={90} />
          </View>
        ) : overview.isError ? (
          <ErrorState message={overview.error instanceof Error ? overview.error.message : "NxDB unavailable."} onRetry={() => overview.refetch()} />
        ) : overview.data ? (
          <>
            <View style={styles.statRow}>
              <GlassCard padding={12} style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontSize: 18, fontWeight: "800" }}>{formatCount(overview.data.overview.databases)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: "600", marginTop: 2 }}>DATABASES</Text>
              </GlassCard>
              <GlassCard padding={12} style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontSize: 18, fontWeight: "800" }}>{formatCount(overview.data.overview.tables)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: "600", marginTop: 2 }}>TABLES</Text>
              </GlassCard>
              <GlassCard padding={12} style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontSize: 18, fontWeight: "800" }}>{formatCount(overview.data.overview.records)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: "600", marginTop: 2 }}>RECORDS</Text>
              </GlassCard>
            </View>

            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Storage usage</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
                {formatBytes(overview.data.overview.storageBytes)} total
                {overview.data.overview.objectStorageBytes > 0
                  ? ` · ${formatBytes(overview.data.overview.objectStorageBytes)} object storage`
                  : ""}
              </Text>
            </GlassCard>
          </>
        ) : null}

        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", marginTop: 18, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Your databases
        </Text>

        {databases.isLoading ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard height={76} />
            <SkeletonCard height={76} />
          </View>
        ) : databases.isError ? (
          <ErrorState message={databases.error instanceof Error ? databases.error.message : "Could not list databases."} onRetry={() => databases.refetch()} />
        ) : (databases.data?.databases.length ?? 0) === 0 ? (
          <EmptyState
            title="No databases yet"
            message="Create databases in the NxMirror web console (nxmirror.netlify.app) — they appear here instantly."
            compact
          />
        ) : (
          databases.data?.databases.map((db) => (
            <GlassCard
              key={db.id}
              padding={14}
              style={{ marginBottom: 10 }}
              onPress={() => router.push({ pathname: "/nxdb/[id]", params: { id: db.id } })}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.dbIcon, { backgroundColor: db.engine === "nosql" ? colors.mintSoft : colors.accentSoft }]}>
                  <DatabaseIcon size={16} color={db.engine === "nosql" ? colors.mint : colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>{db.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>
                    {db.engine} · {formatBytes(db.usage?.storageBytes ?? 0)} · {formatCount(db.usage?.queries ?? 0)} queries
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10.5, marginTop: 1 }}>
                    created {formatDate(db.createdAt)}
                  </Text>
                </View>
                <ChevronRightIcon size={15} color={colors.textMuted} />
              </View>
            </GlassCard>
          ))
        )}

        <GlassCard padding={14} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11.5, lineHeight: 17 }}>
            Access is enforced by the backend: only your own databases are listed, and every query runs under your
            account permissions. Administrative operations are intentionally not exposed here.
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  statRow: { flexDirection: "row", gap: 10 },
  dbIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" }
});
