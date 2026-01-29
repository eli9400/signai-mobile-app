// src/ui/icons.tsx
import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconBtnProps = {
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  hitSlop?: number;
  accessibilityLabel?: string;
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
      {/* ב-RTL חץ שמאלה עדיין "חזרה" באפליקציות ישראליות בד"כ.
          אם תרצה להפוך לפי RTL בהמשך—נוסיף תנאי. */}
      <Ionicons name="chevron-back" size={size} color={color} />
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
});
