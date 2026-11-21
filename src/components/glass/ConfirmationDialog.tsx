import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { GlassButton } from "./GlassButton";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Glass confirmation dialog for destructive / important actions. */
export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const { colors, dark } = useTheme();
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
          <BlurView intensity={dark ? 40 : 60} tint={dark ? "dark" : "light"} style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss dialog" />
        </Animated.View>
        <View style={styles.center}>
          <Animated.View entering={FadeIn.springify().damping(20)} exiting={FadeOut.duration(150)} style={[styles.card, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.title, { color: destructive ? colors.danger : colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            <View style={styles.actions}>
              <GlassButton label={cancelLabel} variant="glass" onPress={onCancel} disabled={loading} style={styles.button} />
              <GlassButton
                label={confirmLabel}
                variant={destructive ? "danger" : "primary"}
                onPress={onConfirm}
                loading={loading}
                style={styles.button}
              />
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16
  },
  title: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  message: { fontSize: 13.5, lineHeight: 20 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 18 },
  button: { minWidth: 110 }
});
