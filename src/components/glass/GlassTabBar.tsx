import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { FolderIcon, GitIcon, HomeIcon, PackageIcon, UserIcon } from "../icons";
import type { IconProps } from "../icons";

interface TabDef {
  name: string;
  label: string;
  Icon: (props: IconProps) => React.ReactElement;
}

const TABS: TabDef[] = [
  { name: "index", label: "Home", Icon: HomeIcon },
  { name: "registry", label: "Registry", Icon: PackageIcon },
  { name: "files", label: "Files", Icon: FolderIcon },
  { name: "git", label: "Git", Icon: GitIcon },
  { name: "account", label: "Account", Icon: UserIcon }
];

interface GlassTabBarProps {
  activeTab: string;
  onSelect: (name: string) => void;
  unreadHint?: Partial<Record<string, boolean>>;
}

/** Custom animated Liquid Glass bottom navigation (5 primary tabs). */
export function GlassTabBar({ activeTab, onSelect, unreadHint }: GlassTabBarProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Platform.select({ android: 10, default: 6 }) as number) }]} pointerEvents="box-none">
      <View style={styles.barShell} pointerEvents="box-none">
        <BlurView
          intensity={dark ? 46 : 60}
          tint={dark ? "dark" : "light"}
          style={[StyleSheet.absoluteFill, styles.blur]}
          experimentalBlurMethod="dimezisBlurView"
        />
        <View style={[styles.bar, { backgroundColor: colors.tabBar, borderColor: colors.tabBarBorder }]}>
          {TABS.map((tab) => {
            const active = activeTab === tab.name;
            return (
              <TabButton
                key={tab.name}
                tab={tab}
                active={active}
                accent={colors.accent}
                inactive={colors.textMuted}
                alert={unreadHint?.[tab.name]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                  onSelect(tab.name);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabButton({
  tab,
  active,
  accent,
  inactive,
  alert,
  onPress
}: {
  tab: TabDef;
  active: boolean;
  accent: string;
  inactive: string;
  alert?: boolean;
  onPress: () => void;
}) {
  const scale = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(active ? 1.06 : 1, { damping: 16, stiffness: 260 }) }] }));
  const color = active ? accent : inactive;
  const Icon = tab.Icon;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={styles.tab} hitSlop={6}>
      <Animated.View style={[styles.iconWrap, scale]}>
        <Icon size={21} color={color} strokeWidth={active ? 2.1 : 1.8} />
        {active && <View style={[styles.indicator, { backgroundColor: accent }]} />}
        {alert && !active && <View style={[styles.alertDot, { backgroundColor: accent }]} />}
      </Animated.View>
      <Text style={[styles.label, { color, fontWeight: active ? "700" : "500" }]}>{tab.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
  barShell: { borderRadius: 26, overflow: "hidden" },
  blur: { borderRadius: 26 },
  bar: {
    flexDirection: "row",
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 6
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  iconWrap: { height: 24, justifyContent: "center" },
  indicator: { position: "absolute", bottom: -6, width: 14, height: 3, borderRadius: 2, alignSelf: "center" },
  alertDot: { position: "absolute", top: -1, right: -4, width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, letterSpacing: 0.1 }
});
