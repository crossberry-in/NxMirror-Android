import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { ScreenHeader, DetailScreen, MetaRow } from "../../src/components/common/ScreenHeader";
import { ErrorState, EmptyState } from "../../src/components/common/States";
import { SkeletonCard } from "../../src/components/common/SkeletonLoader";
import { useDbTables, useDbStorage } from "../../src/hooks/useNxdb";
import { runDbQuery } from "../../src/services/api/nxdb";
import { useAuthStore } from "../../src/stores/auth";
import { formatBytes, formatDate } from "../../src/utils/format";
import { NxDbQueryResult } from "../../src/types/api";

const EXAMPLE_SQL = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;";

/** Single database console: tables, real SQL query runner, object storage. */
export default function NxDbDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const databaseId = String(params.id ?? "");
  const token = useAuthStore((s) => s.token);

  const tables = useDbTables(databaseId, !!token);
  const storage = useDbStorage(databaseId, "", "", !!token);

  const [sql, setSql] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<NxDbQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const run = async () => {
    if (!sql.trim() || !databaseId) return;
    setRunning(true);
    setError(null);
    try {
      const response = await runDbQuery(databaseId, sql.trim());
      setResult(response);
      setHistory((prev) => [sql.trim(), ...prev.filter((item) => item !== sql.trim())].slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed.");
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.fill}>
        <ScreenHeader title="Database" back />
        <ErrorState message="Sign in to open NxDB databases." />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader title={databaseId} subtitle="SQL console · tables · storage" back />
      <DetailScreen>
        <View style={{ paddingHorizontal: 16 }}>
          {/* Query console */}
          <GlassCard padding={16}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>SQL query</Text>
            <View style={[styles.sqlBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
              <TextInput
                multiline
                value={sql}
                onChangeText={setSql}
                placeholder="SELECT * FROM my_table LIMIT 20;"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, minHeight: 90, textAlignVertical: "top" }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <GlassButton label="Run query" variant="primary" loading={running} disabled={!sql.trim()} onPress={run} />
              <GlassButton label="Example" variant="glass" onPress={() => setSql(EXAMPLE_SQL)} />
            </View>
            {history.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  History
                </Text>
                {history.map((item, index) => (
                  <Text key={index} onPress={() => setSql(item)} style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 6 }} numberOfLines={1}>
                    {item}
                  </Text>
                ))}
              </View>
            )}
            {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 10 }}>{error}</Text> : null}
          </GlassCard>

          {/* Result */}
          {result && (
            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>Result</Text>
                <Text style={{ color: colors.mint, fontSize: 11.5, fontWeight: "700" }}>
                  {result.mutation ? "mutation applied" : `${result.rows?.length ?? 0} rows`}
                </Text>
              </View>
              {result.columns && result.rows && result.rows.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 10 }}>
                  <View>
                    <View style={[styles.tableRow, { backgroundColor: colors.surfaceStrong }]}>
                      {result.columns.map((column, index) => (
                        <Text key={index} style={[styles.cell, styles.cellHeader, { color: colors.textPrimary, minWidth: Math.max(80, column.length * 9) }]}>
                          {column}
                        </Text>
                      ))}
                    </View>
                    {result.rows.slice(0, 50).map((row, rowIndex) => (
                      <View key={rowIndex} style={[styles.tableRow, { borderBottomColor: colors.surfaceBorder }]}>
                        {row.map((cell, cellIndex) => (
                          <Text key={cellIndex} style={[styles.cell, { color: colors.textSecondary, minWidth: Math.max(80, String(cell ?? "").length * 8) }]}>
                            {cell === null || cell === undefined ? "NULL" : String(cell)}
                          </Text>
                        ))}
                      </View>
                    ))}
                    {(result.rows.length ?? 0) > 50 && (
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8 }}>Showing first 50 rows.</Text>
                    )}
                  </View>
                </ScrollView>
              ) : !result.mutation ? (
                <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 10 }}>Query returned no rows.</Text>
              ) : null}
            </GlassCard>
          )}

          {/* Tables */}
          <GlassCard padding={16} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Tables</Text>
            {tables.isLoading ? (
              <View style={{ marginTop: 10 }}>
                <SkeletonCard height={54} />
              </View>
            ) : tables.isError ? (
              <Text style={{ color: colors.danger, fontSize: 12, marginTop: 10 }}>
                {tables.error instanceof Error ? tables.error.message : "Could not list tables."}
              </Text>
            ) : (tables.data?.tables.length ?? 0) === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 10 }}>
                No user tables yet — run a CREATE TABLE query above.
              </Text>
            ) : (
              tables.data?.tables.map((table) => (
                <View key={table.name} style={[styles.tableRowPlain, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600", flex: 1 }}>{table.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
                    {typeof table.rows === "number" ? `${table.rows} rows` : ""}
                  </Text>
                </View>
              ))
            )}
          </GlassCard>

          {/* Object storage */}
          <GlassCard padding={16} style={{ marginTop: 12, marginBottom: 30 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Object storage</Text>
            {storage.isLoading ? (
              <View style={{ marginTop: 10 }}>
                <SkeletonCard height={54} />
              </View>
            ) : storage.isError ? (
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10 }}>
                Object storage not available for this database.
              </Text>
            ) : (storage.data?.files.length ?? 0) === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 10 }}>No stored objects.</Text>
            ) : (
              storage.data?.files.slice(0, 30).map((file) => (
                <View key={file.id} style={[styles.tableRowPlain, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {file.filename}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatBytes(file.size)}</Text>
                  <Text style={{ color: file.public ? colors.mint : colors.textMuted, fontSize: 11, marginLeft: 8 }}>
                    {file.public ? "public" : "private"}
                  </Text>
                </View>
              ))
            )}
            {storage.data ? (
              <Text style={{ color: colors.textMuted, fontSize: 10.5, marginTop: 8 }}>
                listed {formatDate(new Date().toISOString())} · {storage.data.folders.length} folders
              </Text>
            ) : null}
          </GlassCard>
        </View>
      </DetailScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sqlBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 10 },
  tableRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  tableRowPlain: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  cell: { fontSize: 11.5, paddingHorizontal: 8 },
  cellHeader: { fontWeight: "800", paddingBottom: 2 }
});
