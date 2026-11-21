import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, ThemeColors } from "./tokens";
import { useSettingsStore } from "../stores/settings";

export interface Theme {
  colors: ThemeColors;
  dark: boolean;
}

const ThemeContext = createContext<Theme>({ colors: darkColors, dark: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  const dark = mode === "system" ? system !== "light" : mode === "dark";
  const theme: Theme = { colors: dark ? darkColors : lightColors, dark };
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
