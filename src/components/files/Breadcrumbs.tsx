import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronRightIcon } from "../icons";
import { useTheme } from "../../theme/ThemeProvider";

interface Crumb {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
  onSelect: (path: string) => void;
}

/** Folder navigation breadcrumbs for the cloud file manager. */
export function Breadcrumbs({ crumbs, onSelect }: BreadcrumbsProps) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <View key={crumb.path || "root"} style={styles.part}>
            <Pressable onPress={() => onSelect(crumb.path)} disabled={last} hitSlop={6}>
              <Text style={{ color: last ? colors.textPrimary : colors.accent, fontSize: 13, fontWeight: last ? "700" : "500" }}>
                {crumb.label}
              </Text>
            </Pressable>
            {!last && <ChevronRightIcon size={13} color={colors.textMuted} />}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 4 },
  part: { flexDirection: "row", alignItems: "center", gap: 4 }
});
