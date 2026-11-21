import React, { useCallback, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../src/theme/ThemeProvider";
import { GlassButton } from "../../src/components/glass/GlassButton";
import { BottomSheet } from "../../src/components/glass/BottomSheet";
import { ConfirmationDialog } from "../../src/components/glass/ConfirmationDialog";
import { SearchField } from "../../src/components/glass/SearchField";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { EmptyState, ErrorState } from "../../src/components/common/States";
import { SkeletonRow } from "../../src/components/common/SkeletonLoader";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { Breadcrumbs } from "../../src/components/files/Breadcrumbs";
import { FileCard, FolderRow } from "../../src/components/files/FileCard";
import { FolderIcon, PlusIcon, UploadIcon } from "../../src/components/icons";
import { useDirectory, runChunkedUpload, runDirectUpload, useFileMutations } from "../../src/hooks/useFiles";
import { useAuthStore } from "../../src/stores/auth";
import { mirrorFileUrl } from "../../src/services/api/files";
import { mimeFromFilename } from "../../src/utils/format";

interface SelectedFile {
  id: string;
  filename: string;
}

export default function FilesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const client = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const params = useLocalSearchParams<{ path?: string }>();

  const initialPath = typeof params.path === "string" ? params.path : "";
  const [path, setPath] = useState(initialPath);
  const [filter, setFilter] = useState("");
  const [folderSheet, setFolderSheet] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SelectedFile | null>(null);
  const [uploadState, setUploadState] = useState<{ active: boolean; label: string; loaded: number; total: number }>({
    active: false,
    label: "",
    loaded: 0,
    total: 0
  });

  const directory = useDirectory(path, !!token);
  const mutations = useFileMutations(path);

  const crumbs = useMemo(() => {
    const list: Array<{ label: string; path: string }> = [{ label: "My files", path: "" }];
    let acc = "";
    for (const part of path.split("/").filter(Boolean)) {
      acc = acc ? `${acc}/${part}` : part;
      list.push({ label: part, path: acc });
    }
    return list;
  }, [path]);

  const folders = useMemo(
    () => (directory.data?.directories ?? []).filter((name) => name.toLowerCase().includes(filter.toLowerCase())),
    [directory.data, filter]
  );
  const files = useMemo(
    () => (directory.data?.files ?? []).filter((file) => file.filename.toLowerCase().includes(filter.toLowerCase())),
    [directory.data, filter]
  );

  const uploadToCurrent = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const filename = asset.name || "upload.bin";
      const size = asset.size ?? 0;
      setUploadState({ active: true, label: `Uploading ${filename}`, loaded: 0, total: Math.max(size, 1) });
      const uploader =
        size > 0 && size <= 4 * 1024 * 1024
          ? runDirectUpload({
              localUri: asset.uri,
              filename,
              mimeType: asset.mimeType || mimeFromFilename(filename),
              folder: path,
              onProgress: (p) => setUploadState((prev) => ({ ...prev, loaded: p.loadedBytes, total: Math.max(p.totalBytes, prev.total) }))
            })
          : runChunkedUpload({
              localUri: asset.uri,
              filename,
              folder: path,
              onProgress: (p) => setUploadState((prev) => ({ ...prev, loaded: p.loadedBytes, total: Math.max(p.totalBytes, prev.total) }))
            });
      await uploader;
      setUploadState((prev) => ({ ...prev, active: false }));
      client.invalidateQueries({ queryKey: ["mirror", "list"] }).catch(() => undefined);
    } catch (error) {
      setUploadState({ active: false, label: error instanceof Error ? error.message : "Upload failed", loaded: 0, total: 0 });
    }
  }, [token, path, client, router]);

  if (!token) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={{ padding: 24, paddingTop: insets.top + 60 }}>
          <EmptyState
            icon={<FolderIcon size={26} color={colors.accent} />}
            title="Your cloud files"
            message="Sign in with your NxMirror account to browse folders, upload files and manage your personal storage."
            actionLabel="Sign in"
            onAction={() => router.push("/auth/login")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={[styles.header, { paddingHorizontal: 16 }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Cloud Files</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Personal storage · chunked uploads for any size</Text>
            </View>
            <GlassButton label="Upload" variant="primary" size="sm" icon={<UploadIcon size={13} color="#0A0F16" />} onPress={uploadToCurrent} />
          </View>

          <View style={{ marginTop: 12 }}>
            <Breadcrumbs crumbs={crumbs} onSelect={(next) => setPath(next)} />
          </View>

          <SearchField
            value={filter}
            onChangeText={setFilter}
            placeholder="Filter this folder…"
            onClear={() => setFilter("")}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>

      {directory.data?.warning && (
        <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
          <Text style={{ color: colors.danger, fontSize: 11.5, fontWeight: "600" }}>{directory.data.warning}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={directory.isRefetching} onRefresh={() => { directory.refetch(); }} tintColor={colors.accent} progressBackgroundColor={colors.backgroundAlt} />
        }
      >
        {directory.isLoading ? (
          <View style={{ gap: 8, paddingTop: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </View>
        ) : directory.isError ? (
          <ErrorState message={directory.error instanceof Error ? directory.error.message : "Cloud files unavailable."} onRetry={() => directory.refetch()} />
        ) : folders.length === 0 && files.length === 0 ? (
          <EmptyState
            icon={<FolderIcon size={26} color={colors.accent} />}
            title={filter ? "Nothing matches" : path ? "Empty folder" : "No files yet"}
            message={filter ? "No file or folder matches your filter." : "Create a folder or upload your first file."}
            actionLabel={filter ? undefined : "Upload file"}
            onAction={filter ? undefined : uploadToCurrent}
          />
        ) : (
          <>
            {folders.map((folder) => (
              <FolderRow key={folder} name={folder} onPress={() => setPath(path ? `${path}/${folder}` : folder)} />
            ))}
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPress={() => setSelected({ id: file.id, filename: file.filename })}
                onLongPress={() => setConfirmDelete({ id: file.id, filename: file.filename })}
              />
            ))}
          </>
        )}

        <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
          <GlassButton label="New folder" variant="glass" icon={<PlusIcon size={14} color={colors.accent} />} onPress={() => setFolderSheet(true)} />
        </View>
      </ScrollView>

      {/* New folder sheet */}
      <BottomSheet visible={folderSheet} onClose={() => setFolderSheet(false)} title="New folder" heightRatio={0.34}>
        <SearchField value={newFolderName} onChangeText={setNewFolderName} placeholder="Folder name" autoFocus />
        <View style={{ marginTop: 14 }}>
          <GlassButton
            label="Create folder"
            variant="primary"
            loading={mutations.createFolderMutation.isPending}
            disabled={!newFolderName.trim()}
            onPress={() => {
              mutations.createFolderMutation.mutate(newFolderName.trim(), {
                onSuccess: () => {
                  setFolderSheet(false);
                  setNewFolderName("");
                },
                onError: (error) => setUploadState({ active: false, label: error instanceof Error ? error.message : "Could not create folder", loaded: 0, total: 0 })
              });
            }}
          />
        </View>
      </BottomSheet>

      {/* File actions sheet */}
      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.filename} heightRatio={0.42}>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
          Actions use the real NxMirror file APIs — download streams through your own domain.
        </Text>
        <View style={{ gap: 10 }}>
          <GlassButton
            label="Open details"
            variant="primary"
            onPress={() => {
              if (selected) router.push({ pathname: "/file/[id]", params: { id: selected.id, filename: selected.filename } });
              setSelected(null);
            }}
          />
          <GlassButton
            label="Rename"
            variant="glass"
            loading={mutations.renameMutation.isPending}
            onPress={() => {
              if (!selected) return;
              const name = selected.filename;
              const dot = name.lastIndexOf(".");
              const proposed = dot > 0 ? `${name.slice(0, dot)}-renamed${name.slice(dot)}` : `${name}-renamed`;
              mutations.renameMutation.mutate({ id: selected.id, filename: proposed }, { onSuccess: () => setSelected(null) });
            }}
          />
          <GlassButton label="Copy NxMirror URL" variant="glass" onPress={async () => {
            if (!selected) return;
            await Clipboard.setStringAsync(mirrorFileUrl(selected.id, selected.filename));
            setSelected(null);
          }} />
          <GlassButton label="Delete file" variant="danger" onPress={() => { if (selected) { setConfirmDelete(selected); setSelected(null); } }} />
        </View>
      </BottomSheet>

      <ConfirmationDialog
        visible={!!confirmDelete}
        title="Delete file?"
        message={confirmDelete ? `“${confirmDelete.filename}” will be removed from your cloud storage. This cannot be undone.` : ""}
        confirmLabel="Delete"
        destructive
        loading={mutations.deleteMutation.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          mutations.deleteMutation.mutate(confirmDelete.id, { onSettled: () => setConfirmDelete(null) });
        }}
      />

      <LoadingOverlay
        visible={uploadState.active}
        label={uploadState.total > 0 ? `${uploadState.label} — ${Math.round((uploadState.loaded / uploadState.total) * 100)}%` : uploadState.label || "Working…"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 3 },
  warning: { marginHorizontal: 16, marginTop: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }
});
