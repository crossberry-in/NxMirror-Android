import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeOutUp, SlideInDown, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Fraction of screen height the sheet occupies. */
  heightRatio?: number;
}

/** Animated glass bottom sheet with drag-to-dismiss. */
export function BottomSheet({ visible, onClose, title, children, heightRatio = 0.55 }: BottomSheetProps) {
  const { colors, dark } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [mounted, setMounted] = useState(visible);
  const openRef = useRef(visible);

  useEffect(() => {
    if (visible && !openRef.current) {
      setMounted(true);
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, { duration: 320 });
    }
    if (!visible && openRef.current) {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    openRef.current = visible;
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 900) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  if (!mounted) return null;

  const height = SCREEN_HEIGHT * heightRatio;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOutUp.duration(180)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <BlurView intensity={dark ? 28 : 40} tint={dark ? "dark" : "light"} style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View entering={SlideInDown.springify().damping(22)} exiting={FadeOutUp.duration(200)} style={[styles.sheet, { height, backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }, sheetStyle]}>
          <View style={[styles.grabber, { backgroundColor: colors.textMuted }]} />
          {title ? (
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          ) : null}
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { zIndex: 40, backgroundColor: "rgba(4,7,12,0.5)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 41,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24
  },
  grabber: { alignSelf: "center", width: 44, height: 4, borderRadius: 4, marginTop: 4, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 12 }
});
