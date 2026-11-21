import React, { useEffect, useRef, useState } from "react";
import { Animated as RNAnimated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { WifiOffIcon } from "../icons";

/**
 * Real-network offline banner — shown only when the API reachability probe
 * actually fails (never assumed). Animated with the classic RN Animated API.
 */
export function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const network = useNetworkStatus();
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const fade = useRef(new RNAnimated.Value(0)).current;
  const visibleRef = useRef(false);

  const offline = network.apiReachable === false || (!network.isConnected && network.isInternetReachable === false);
  const changed = network.checkedAt !== dismissedAt;
  const show = offline && changed;

  useEffect(() => {
    if (show && !visibleRef.current) {
      visibleRef.current = true;
      RNAnimated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else if (!show && visibleRef.current) {
      visibleRef.current = false;
      RNAnimated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [show, fade]);

  if (!show) return null;

  return (
    <RNAnimated.View style={[styles.wrap, { top: insets.top + 4, opacity: fade }]} pointerEvents="box-none">
      <Pressable
        onPress={() => setDismissedAt(network.checkedAt)}
        style={[styles.banner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
      >
        <WifiOffIcon size={14} color={colors.danger} />
        <Text style={{ color: colors.danger, fontSize: 11.5, fontWeight: "700", flex: 1 }}>
          NxMirror API unreachable — showing cached data. Tap to dismiss.
        </Text>
        <Text onPress={network.refresh} style={{ color: colors.danger, fontSize: 11.5, fontWeight: "800" }}>
          retry
        </Text>
      </Pressable>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14, zIndex: 100 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  }
});
