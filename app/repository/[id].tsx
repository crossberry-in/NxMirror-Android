import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassCard } from "../../src/components/glass/GlassCard";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { BottomSheet } from "../../src/components/glass/BottomSheet";
import { ConfirmationDialog } from "../../src/components/glass/ConfirmationDialog";
import { SearchField } from "../../src/components/glass/SearchField";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { ScreenHeader, DetailScreen, MetaRow } from "../../src/components/common/ScreenHeader";
import { Skeleton, SkeletonSection } from "../../src/components/common/SkeletonLoader";
import { ErrorState, EmptyState } from "../../src/components/common/States";
import { CommitRow } from "../../src/components/git/CommitRow";
import { CopyIcon, DownloadIcon, FileIcon, FolderIcon, GitIcon, StarIcon, TrashIcon, UploadIcon } from "../../src/components/icons";
import { useGitMutations, useRepoFile, useRepository } from "../../src/hooks/useGit";
import { useAuthStore } from "../../src/stores/auth";
import { fetchRepoZipUrl } from "../../src/services/api/git";
import { downloadAndShare } from "../../src/utils/download";
import { formatBytes, formatDate, formatWhen, isReadableTextMime, mimeFromFilename } from "../../src/utils/format";

/** Repository detail — real Noxs Git Cloud data (GET /api/git?action=repo). */
export default function RepositoryDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const repoRef = String(params.id ?? "");
  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.user?.username ?? null);

  const repo = useRepository(repoRef, !!token && !!repoRef);
  const mutations = useGitMutations(repoRef);

  const [filter, setFilter] = useState("");
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [uploadContent, setUploadContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRepoDelete, setConfirmRepoDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"none" | "settings">("none");

  const fileContent = useRepoFile(repoRef, openPath ?? "", !!openPath);

  const data = repo.data;
  const isOwner = !!data?.repository && data.repository.owner === username;

  const visibleFiles = useMemo(() => {
    const files = data?.files ?? [];
    return files.filter((meta) => meta.path.toLowerCase().includes(filter.toLowerCase())).slice(0, 60);
  }, [data, filter]);

  const folderEntries = useMemo(() => {
    const folders = new Set<string>();
    for (const meta of data?.files ?? []) {
      const parts = meta.path.split("/");
      if (parts.length > 1) folders.add(parts[0] + (parts.length > 2 ? "/…" : ""));
    }
    return [...folders].filter((f) => f.toLowerCase().includes(filter.toLowerCase()));
  }, [data, filter]);

  if (!token) {
    return (
      <View style={styles.fill}>
        <ScreenHeader title={repoRef || "Repository"} back />
        <ErrorState message="Sign in to browse Noxs Git Cloud repositories." />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={data?.repository ? `${data.repository.owner}/${data.repository.name}` : repoRef || "Repository"}
        subtitle={data?.repository ? `${data.repository.visibility} · ${data.repository.defaultBranch} · ${data.repository.stars}★` : undefined}
        back
        right={
          data?.repository ? (
            <GlassButton
              label={data.starred ? "★ Starred" : "☆ Star"}
              variant="glass"
              size="sm"
              onPress={() => mutations.star.mutate(!data.starred)}
              loading={mutations.star.isPending}
            />
          ) : undefined
        }
      />

      {repo.isLoading ? (
        <View style={{ padding: 16 }}>
          <SkeletonSection rows={5} />
        </View>
      ) : repo.isError || !data ? (
        <ErrorState
          message={repo.error instanceof Error ? repo.error.message : "Repository unavailable."}
          onRetry={() => repo.refetch()}
        />
      ) : (
        <DetailScreen>
          <View style={{ paddingHorizontal: 16 }}>
            <MetaRow
              items={[
                { label: "Stars", value: String(data.repository.stars) },
                { label: "Forks", value: String(data.repository.forks) },
                { label: "Files", value: String(data.files.length) },
                { label: "Updated", value: formatWhen(data.repository.updatedAt) }
              ]}
            />

            {data.repository.description ? (
              <GlassCard padding={16} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20 }}>{data.repository.description}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                  <GlassButton
                    label="Copy clone URL"
                    variant="glass"
                    icon={<CopyIcon size={13} color={colors.accent} />}
                    onPress={async () => {
                      await Clipboard.setStringAsync(`nxc clone ${data.repository.owner}/${data.repository.name}`);
                      setNotice("Clone command copied");
                    }}
                  />
                  {isOwner && (
                    <GlassButton label="Settings" variant="glass" onPress={() => setSheet("settings")} />
                  )}
                  {!isOwner && (
                    <GlassButton
                      label="Fork"
                      variant="glass"
                      loading={mutations.fork.isPending}
                      onPress={() =>
                        mutations.fork.mutate(undefined, {
                          onSuccess: (res) => {
                            if (res?.repository) {
                              router.replace({ pathname: "/repository/[id]", params: { id: `${res.repository.owner}/${res.repository.name}` } });
                            }
                          },
                          onError: (err) => setNotice(err instanceof Error ? err.message : "Fork failed")
                        })
                      }
                    />
                  )}
                </View>
              </GlassCard>
            ) : null}

            {notice ? <Text style={{ color: colors.mint, fontSize: 12, marginTop: 10 }}>{notice}</Text> : null}

            {/* Files */}
            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <FolderIcon size={16} color={colors.accent} />
                <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700", marginLeft: 8 }}>
                  Files ({data.files.length})
                </Text>
                <View style={{ flex: 1 }} />
                {isOwner && (
                  <GlassButton label="Add file" variant="primary" size="sm" icon={<UploadIcon size={12} color="#0A0F16" />} onPress={() => { setUploadPath("new-file.txt"); setUploadContent(""); }} />
                )}
              </View>
              <SearchField value={filter} onChangeText={setFilter} placeholder="Filter files…" onClear={() => setFilter("")} />
              <View style={{ marginTop: 8 }}>
                {folderEntries.slice(0, 8).map((folder) => (
                  <View key={folder} style={[styles.fileRow, { borderBottomColor: colors.surfaceBorder }]}>
                    <FolderIcon size={14} color={colors.accent} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 8, flex: 1 }}>{folder}</Text>
                  </View>
                ))}
                {visibleFiles.map((meta) => (
                  <View key={meta.path} style={[styles.fileRow, { borderBottomColor: colors.surfaceBorder }]}>
                    <FileIcon size={14} color={colors.textMuted} />
                    <Text
                      onPress={() => setOpenPath(meta.path)}
                      style={{ color: colors.textPrimary, fontSize: 13, marginLeft: 8, flex: 1 }}
                      numberOfLines={1}
                    >
                      {meta.path}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatBytes(meta.size)}</Text>
                    {isOwner && (
                      <Text onPress={() => setConfirmDelete(meta.path)} style={{ color: colors.danger, fontSize: 11, fontWeight: "700", marginLeft: 10 }}>
                        delete
                      </Text>
                    )}
                  </View>
                ))}
                {data.files.length === 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12.5, paddingVertical: 10 }}>
                    No files yet{isOwner ? " — add your first file." : "."}
                  </Text>
                )}
              </View>
            </GlassCard>

            {/* Branches & tags */}
            <GlassCard padding={16} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>
                Branches ({data.branches.length}) · Tags ({data.tags.length})
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {data.branches.map((branch) => (
                  <View key={branch.name} style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                    <Text style={{ color: colors.accent, fontSize: 11.5, fontWeight: "600" }}>{branch.name}</Text>
                  </View>
                ))}
                {data.tags.map((tag) => (
                  <View key={tag.name} style={[styles.pill, { backgroundColor: colors.mintSoft }]}>
                    <Text style={{ color: colors.mint, fontSize: 11.5, fontWeight: "600" }}>{tag.name}</Text>
                  </View>
                ))}
                {data.branches.length === 0 && data.tags.length === 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>No branches or tags yet.</Text>
                )}
              </View>
            </GlassCard>

            {/* Releases & issues */}
            {(data.releases.length > 0 || data.issues.length > 0) && (
              <GlassCard padding={16} style={{ marginTop: 12 }}>
                {data.releases.length > 0 && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>Releases</Text>
                    {data.releases.slice(0, 5).map((release) => (
                      <View key={release.id} style={{ marginTop: 8 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>
                          {release.title} <Text style={{ color: colors.accent }}>{release.tagName}</Text>
                        </Text>
                        {release.body ? <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>{release.body}</Text> : null}
                      </View>
                    ))}
                  </>
                )}
                {data.issues.length > 0 && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700", marginTop: data.releases.length ? 14 : 0 }}>
                      Issues ({data.issues.length})
                    </Text>
                    {data.issues.slice(0, 5).map((issue) => (
                      <Text key={issue.id} style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 6 }} numberOfLines={1}>
                        #{issue.number} · {issue.title} ({issue.state})
                      </Text>
                    ))}
                  </>
                )}
              </GlassCard>
            )}

            {/* Commit history */}
            <GlassCard padding={16} style={{ marginTop: 12, marginBottom: 30 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: "700" }}>
                Commit history ({data.commits.length})
              </Text>
              <View style={{ marginTop: 4 }}>
                {data.commits.slice(0, 20).map((commit, index) => (
                  <CommitRow key={commit.id ?? `${commit.createdAt}-${index}`} commit={commit} />
                ))}
                {data.commits.length === 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12.5, paddingVertical: 10 }}>No commits yet.</Text>
                )}
              </View>
            </GlassCard>
          </View>
        </DetailScreen>
      )}

      {/* File viewer sheet */}
      <BottomSheet visible={!!openPath} onClose={() => setOpenPath(null)} title={openPath ?? ""} heightRatio={0.72}>
        {fileContent.isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton width="80%" height={12} />
            <Skeleton width="60%" height={12} />
            <Skeleton width="70%" height={12} />
          </View>
        ) : fileContent.data ? (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              {fileContent.data.encoding} · {formatBytes(fileContent.data.metadata?.size)}
            </Text>
            <View style={[styles.codeBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
              {isReadableTextMime(fileContent.data.mime) && fileContent.data.encoding === "text" ? (
                <Text selectable style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 17 }}>
                  {String(fileContent.data.content).slice(0, 6000)}
                </Text>
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Binary content ({mimeFromFilename(openPath ?? "")}). Download to view.
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <GlassButton
                label="Download raw"
                variant="primary"
                onPress={async () => {
                  if (!openPath || !data) return;
                  setBusy("raw");
                  try {
                    const base = fetchRepoZipUrl(repoRef).split("?")[0];
                    const url = `${base}?action=raw&repo=${encodeURIComponent(repoRef)}&path=${encodeURIComponent(openPath)}`;
                    await downloadAndShare({ url, filename: openPath.split("/").pop() || "file", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                    setOpenPath(null);
                  } catch (error) {
                    setNotice(error instanceof Error ? error.message : "Download failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              />
              <GlassButton label="Close" variant="glass" onPress={() => setOpenPath(null)} />
            </View>
          </>
        ) : (
          <ErrorState compact message={fileContent.error instanceof Error ? fileContent.error.message : "File unavailable."} onRetry={() => fileContent.refetch()} />
        )}
      </BottomSheet>

      {/* Add/edit file sheet */}
      <BottomSheet visible={!!uploadPath} onClose={() => setUploadPath(null)} title="Save file (creates a commit)" heightRatio={0.72}>
        <SearchField value={uploadPath ?? ""} onChangeText={setUploadPath} placeholder="File path, e.g. src/index.js" />
        <View style={[styles.codeBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder, marginTop: 12 }]}>
          <TextInput
            multiline
            value={uploadContent}
            onChangeText={setUploadContent}
            placeholder="File content…"
            placeholderTextColor={colors.textMuted}
            style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, minHeight: 140, textAlignVertical: "top", padding: 4 }}
          />
        </View>
        <View style={{ marginTop: 14 }}>
          <GlassButton
            label="Commit file"
            variant="primary"
            loading={mutations.saveFile.isPending}
            disabled={!uploadPath?.trim()}
            onPress={() => {
              if (!uploadPath?.trim()) return;
              mutations.saveFile.mutate(
                { path: uploadPath.trim(), content: uploadContent, encoding: "text", message: `Update ${uploadPath.trim()} from NxMirror Android` },
                {
                  onSuccess: () => {
                    setUploadPath(null);
                    setNotice("File committed");
                  },
                  onError: (error) => setNotice(error instanceof Error ? error.message : "Commit failed")
                }
              );
            }}
          />
        </View>
      </BottomSheet>

      {/* Settings sheet */}
      <BottomSheet visible={sheet === "settings"} onClose={() => setSheet("none")} title="Repository settings" heightRatio={0.5}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          Rename visibility, download the SQL snapshot or archive, or delete this repository. Owner-only actions are
          enforced by the backend.
        </Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <GlassButton
            label={`Make ${data?.repository.visibility === "public" ? "private" : "public"}`}
            variant="glass"
            loading={mutations.update.isPending}
            onPress={() =>
              mutations.update.mutate(
                { visibility: data?.repository.visibility === "public" ? "private" : "public" },
                { onSuccess: () => setSheet("none") }
              )
            }
          />
          <GlassButton
            label="Download repository ZIP"
            variant="glass"
            icon={<DownloadIcon size={13} color={colors.accent} />}
            onPress={async () => {
              setBusy("zip");
              setSheet("none");
              try {
                await downloadAndShare({ url: fetchRepoZipUrl(repoRef), filename: `${repoRef.split("/").pop() ?? "repo"}.zip`, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "ZIP download failed");
              } finally {
                setBusy(null);
              }
            }}
          />
          <GlassButton label="Delete repository" variant="danger" onPress={() => { setSheet("none"); setConfirmRepoDelete(true); }} />
        </View>
      </BottomSheet>

      <ConfirmationDialog
        visible={!!confirmDelete}
        title="Delete file?"
        message={confirmDelete ? `“${confirmDelete}” will be removed and a delete commit created.` : ""}
        confirmLabel="Delete"
        destructive
        loading={mutations.removeFile.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          mutations.removeFile.mutate(
            { path: confirmDelete, message: `Delete ${confirmDelete} from NxMirror Android` },
            { onSettled: () => setConfirmDelete(null) }
          );
        }}
      />

      <ConfirmationDialog
        visible={confirmRepoDelete}
        title="Delete repository?"
        message="All branches, files, commits and releases of this repository will be removed. This cannot be undone."
        confirmLabel="Delete forever"
        destructive
        loading={mutations.remove.isPending}
        onCancel={() => setConfirmRepoDelete(false)}
        onConfirm={() => {
          mutations.remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmRepoDelete(false);
              router.back();
            },
            onError: () => setConfirmRepoDelete(false)
          });
        }}
      />

      <LoadingOverlay visible={busy !== null} label={busy === "zip" ? "Preparing ZIP…" : "Downloading…"} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fileRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  codeBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 8 }
});
