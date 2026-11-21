import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import { useTheme } from "../src/theme/ThemeProvider";
import { GlassCard } from "../src/components/glass/GlassCard";
import { GlassButton } from "../src/components/glass/GlassButton";
import { ScreenHeader } from "../src/components/common/ScreenHeader";
import { EmptyState } from "../src/components/common/States";
import { LoadingOverlay } from "../src/components/common/LoadingOverlay";
import { usePublishArtifact } from "../src/hooks/usePackages";
import { useAuthStore } from "../src/stores/auth";
import { LIMITS } from "../src/constants/config";
import { mimeFromFilename } from "../src/utils/format";

/** Publish an artifact to the NxMirror registry (POST /api/cloud/publish). */
export default function PublishScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const publish = usePublishArtifact();

  const [file, setFile] = useState<{ name: string; uri: string; size: number; mime: string } | null>(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [type, setType] = useState<"package" | "plugin">("package");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [description, setDescription] = useState("");
  const [license, setLicense] = useState("MIT");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const picked = useMemo(() => !!file, [file]);
  const tooBig = !!file && file.size > LIMITS.publishMaxBytes;
  const nameValid = /^(?:[a-z0-9][a-z0-9._-]{1,63})$/.test(name.trim());
  const versionValid = /^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(version.trim());

  if (!token) {
    return (
      <View style={styles.fill}>
        <ScreenHeader title="Publish" subtitle="Share an artifact with the registry" back />
        <EmptyState
          title="Sign in to publish"
          message="Publishing uploads the artifact bytes into your account's immutable store with registry metadata. 4 MiB per artifact."
          actionLabel="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      </View>
    );
  }

  const pickFile = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const filename = asset.name || "artifact.bin";
      setFile({
        name: filename,
        uri: asset.uri,
        size: asset.size ?? 0,
        mime: asset.mimeType || mimeFromFilename(filename)
      });
      if (!name.trim()) {
        const base = filename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
        if (base) setName(base.slice(0, 64));
      }
    } catch {
      setError("Could not open the document picker.");
    }
  };

  const submit = async () => {
    if (!file) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      publish.mutate(
        {
          type,
          name: name.trim(),
          version: version.trim(),
          filename: file.name,
          visibility,
          description: description.trim(),
          license: license.trim(),
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          base64
        },
        {
          onSuccess: (data) => {
            setSuccess(`Published ${data.artifact.owner}/${data.artifact.name}@${data.artifact.version}`);
            setFile(null);
          },
          onError: (err) => setError(err instanceof Error ? err.message : "Publishing failed.")
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Publish artifact" subtitle="POST /api/cloud/publish · immutable versions" back />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <GlassCard padding={16}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Artifact file</Text>
          <GlassButton label={picked ? `Replace ${file?.name}` : "Choose file"} variant={picked ? "glass" : "primary"} onPress={pickFile} style={{ marginTop: 10 }} />
          {file ? (
            <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 8 }}>
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB {tooBig ? "— exceeds the 4 MiB limit" : ""}
            </Text>
          ) : (
            <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 8 }}>
              Any file up to 4 MiB — .tgz archives from npm pack, plugins, libraries…
            </Text>
          )}
        </GlassCard>

        <GlassCard padding={16} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>Metadata</Text>

          <Text style={fieldLabel(colors.textMuted)}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => setName(value.toLowerCase())}
            placeholder="my-library"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />
          {name.length > 0 && !nameValid ? <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>Lowercase letters, numbers, . _ - (2+ chars)</Text> : null}

          <Text style={fieldLabel(colors.textMuted)}>Version</Text>
          <TextInput
            value={version}
            onChangeText={setVersion}
            placeholder="1.0.0"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />
          {!versionValid ? <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>Semantic version required (e.g. 1.0.0)</Text> : null}

          <Text style={fieldLabel(colors.textMuted)}>Kind</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GlassButton label="Package" variant={type === "package" ? "primary" : "glass"} onPress={() => setType("package")} />
            <GlassButton label="Plugin" variant={type === "plugin" ? "primary" : "glass"} onPress={() => setType("plugin")} />
          </View>

          <Text style={fieldLabel(colors.textMuted)}>Visibility</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GlassButton label="Public (no-login install)" variant={visibility === "public" ? "primary" : "glass"} onPress={() => setVisibility("public")} />
            <GlassButton label="Private" variant={visibility === "private" ? "primary" : "glass"} onPress={() => setVisibility("private")} />
          </View>

          <Text style={fieldLabel(colors.textMuted)}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Short description shown in search results"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.multiline, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />

          <Text style={fieldLabel(colors.textMuted)}>License</Text>
          <TextInput
            value={license}
            onChangeText={setLicense}
            placeholder="MIT"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />

          <Text style={fieldLabel(colors.textMuted)}>Tags (comma separated)</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="tooling, json, cli"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />
        </GlassCard>

        {error ? <Text style={{ color: colors.danger, fontSize: 12.5, marginTop: 12 }}>{error}</Text> : null}
        {success ? <Text style={{ color: colors.mint, fontSize: 12.5, marginTop: 12 }}>{success}</Text> : null}

        <GlassButton
          label="Publish to registry"
          variant="primary"
          size="lg"
          style={{ alignSelf: "stretch", justifyContent: "center", marginTop: 16 }}
          loading={publish.isPending || busy}
          disabled={!file || tooBig || !nameValid || !versionValid}
          onPress={submit}
        />
        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 10, lineHeight: 17 }}>
          Publishing is atomic per version: a re-publish of the same name@version returns “already published and
          immutable” (409). Public artifacts appear in search, the web registry and can be installed by anyone without
          login.
        </Text>
      </ScrollView>
      <LoadingOverlay visible={busy && publish.isPending} label="Encrypting & uploading…" />
    </View>
  );
}

const fieldLabel = (color: string) => ({
  color,
  fontSize: 10.5,
  fontWeight: "700" as const,
  textTransform: "uppercase" as const,
  letterSpacing: 0.6,
  marginTop: 14
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    marginTop: 6
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
});
