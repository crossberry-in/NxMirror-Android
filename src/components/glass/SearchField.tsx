import React from "react";
import { Pressable, StyleSheet, Text, TextInputProps, TextInput, View } from "react-native";
import { CloseIcon, SearchIcon } from "../icons";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface SearchFieldProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Rounded glass search field with clear action. */
export function SearchField({ value, onChangeText, onClear, onSubmitEditing, placeholder = "Search", autoFocus, ...rest }: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <SearchIcon size={17} color={colors.textMuted} />
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        {...rest}
      />
      {value.length > 0 && onClear && (
        <Pressable
          onPress={onClear}
          hitSlop={10}
          accessibilityLabel="Clear search"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <CloseIcon size={15} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 }
});
