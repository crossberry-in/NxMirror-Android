import React, { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Single shimmering skeleton block. */
export function Skeleton({ width = "100%", height = 14, circle = false, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withDelay(
      Math.random() * 260,
      withRepeat(withTiming(1, { duration: 640, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.skeleton,
          borderRadius: circle ? radius.pill : radius.sm
        },
        animated,
        style
      ]}
    />
  );
}

/** Skeleton for a card row (avatar + two text lines). */
export function SkeletonRow({ lines = 2 }: { lines?: number }) {
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} circle />
      <View style={styles.rowBody}>
        <Skeleton width="62%" height={13} />
        <Skeleton width="38%" height={11} />
        {lines > 2 && <Skeleton width="80%" height={11} />}
      </View>
    </View>
  );
}

/** Skeleton for a package/file card grid item. */
export function SkeletonCard({ height = 96 }: { height?: number }) {
  return (
    <View style={[styles.card, { height }]}>
      <Skeleton width={34} height={34} circle />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="45%" height={11} />
      </View>
    </View>
  );
}

/** Full section skeleton used while an async screen loads. */
export function SkeletonSection({ rows = 4, cardHeight }: { rows?: number; cardHeight?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, index) =>
        cardHeight ? <SkeletonCard key={index} height={cardHeight} /> : <SkeletonRow key={index} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  rowBody: { flex: 1, gap: 7 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.0001)"
  }
});
