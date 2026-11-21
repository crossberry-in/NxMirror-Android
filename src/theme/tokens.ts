import { StyleSheet } from "react-native";

/**
 * NxMirror "Liquid Glass" design system tokens.
 * Brand colors match the NxMirror web identity (#89CEFF sky, #4EDEA3 mint).
 */

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  gradientFrom: string;
  gradientTo: string;
  surface: string;
  surfaceStrong: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  mint: string;
  mintSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  success: string;
  skeleton: string;
  skeletonHighlight: string;
  tabBar: string;
  tabBarBorder: string;
  shimmer: string;
}

export const darkColors: ThemeColors = {
  background: "#0B0E14",
  backgroundAlt: "#10141C",
  gradientFrom: "#131B2B",
  gradientTo: "#080B11",
  surface: "rgba(255,255,255,0.055)",
  surfaceStrong: "rgba(255,255,255,0.09)",
  surfaceBorder: "rgba(255,255,255,0.11)",
  textPrimary: "#F2F6FC",
  textSecondary: "#A9B4C6",
  textMuted: "#6B7688",
  accent: "#89CEFF",
  accentSoft: "rgba(137,206,255,0.16)",
  mint: "#4EDEA3",
  mintSoft: "rgba(78,222,163,0.15)",
  danger: "#FF7A8A",
  dangerSoft: "rgba(255,122,138,0.14)",
  warning: "#FFD08A",
  success: "#4EDEA3",
  skeleton: "rgba(255,255,255,0.07)",
  skeletonHighlight: "rgba(255,255,255,0.14)",
  tabBar: "rgba(13,18,28,0.82)",
  tabBarBorder: "rgba(255,255,255,0.10)",
  shimmer: "rgba(255,255,255,0.10)"
};

export const lightColors: ThemeColors = {
  background: "#F6F8FB",
  backgroundAlt: "#EEF2F8",
  gradientFrom: "#FFFFFF",
  gradientTo: "#E9EEF6",
  surface: "rgba(255,255,255,0.68)",
  surfaceStrong: "rgba(255,255,255,0.85)",
  surfaceBorder: "rgba(15,23,42,0.09)",
  textPrimary: "#101828",
  textSecondary: "#475467",
  textMuted: "#8A94A6",
  accent: "#1E8ED8",
  accentSoft: "rgba(30,142,216,0.12)",
  mint: "#12A971",
  mintSoft: "rgba(18,169,113,0.12)",
  danger: "#D64550",
  dangerSoft: "rgba(214,69,80,0.10)",
  warning: "#B97E1B",
  success: "#12A971",
  skeleton: "rgba(15,23,42,0.07)",
  skeletonHighlight: "rgba(15,23,42,0.13)",
  tabBar: "rgba(255,255,255,0.86)",
  tabBarBorder: "rgba(15,23,42,0.08)",
  shimmer: "rgba(255,255,255,0.55)"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.6 },
  title: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3 },
  heading: { fontSize: 16, fontWeight: "650" as const },
  body: { fontSize: 14, fontWeight: "400" as const },
  small: { fontSize: 12, fontWeight: "400" as const },
  tiny: { fontSize: 10, fontWeight: "500" as const, letterSpacing: 0.6 }
};

export const glassShadow = {
  elevation: 10,
  shadowColor: "#000",
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 }
};

export const commonStyles = StyleSheet.create({
  screenPadding: { paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" }
});
