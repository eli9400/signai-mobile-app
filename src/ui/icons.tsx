// src/ui/icons.tsx
import React from "react";
import { Pressable, StyleSheet, ViewStyle, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Foundation from "@expo/vector-icons/Foundation";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type IconBtnProps = {
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  hitSlop?: number;
  accessibilityLabel?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
};

type PillBtnProps = {
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  hitSlop?: number;
  accessibilityLabel?: string;
  label: string;
};

// כפתור "חזרה" אחיד לכל הפרויקט
export function BackIconButton({
  onPress,
  disabled,
  size = 22,
  color = "#0f172a",
  style,
  hitSlop = 10,
  accessibilityLabel = "חזרה",
}: Omit<IconBtnProps, "iconName">) {
  return (
    <ActionIconButton
      onPress={onPress}
      disabled={disabled}
      iconName="chevron-back"
      size={size}
      color={color}
      style={style}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export function ActionIconButton({
  onPress,
  disabled,
  iconName,
  size = 22,
  color = "#0f172a",
  style,
  hitSlop = 10,
  accessibilityLabel,
}: IconBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconBtn,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Ionicons name={iconName as any} size={size} color={color} />
    </Pressable>
  );
}

export function ExportPdfPillButton({
  onPress,
  disabled,
  label,
  size = 22,
  color = "#6d28d9",
  style,
  hitSlop = 10,
  accessibilityLabel,
}: PillBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.pillBtn,
        pressed && !disabled ? styles.pillPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Foundation name="page-export-pdf" size={size} color={color} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ExportPngPillButton({
  onPress,
  disabled,
  label,
  size = 22,
  color = "#6d28d9",
  style,
  hitSlop = 10,
  accessibilityLabel,
}: PillBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.pillBtn,
        pressed && !disabled ? styles.pillPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <MaterialCommunityIcons name="file-png-box" size={size} color={color} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,1)",
  },
  disabled: {
    opacity: 0.5,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
  },
  pillPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: "rgba(255,255,255,1)",
  },
  pillText: {
    fontWeight: "900",
    fontSize: 14,
  },
});
