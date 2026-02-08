import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./OverlayActionButtons.styles";

type Props = {
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimaryPress: () => void;
  secondaryLabel: string;
  secondaryDisabled?: boolean;
  onSecondaryPress: () => void;
};

export default function OverlayActionButtons({
  primaryLabel,
  primaryDisabled,
  onPrimaryPress,
  secondaryLabel,
  secondaryDisabled,
  onSecondaryPress,
}: Props) {
  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.primaryBtn, primaryDisabled && styles.disabled]}
        disabled={primaryDisabled}
        onPress={onPrimaryPress}
      >
        <Ionicons name="text-outline" size={18} color="white" />
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>

      <Pressable
        style={[styles.secondaryBtn, secondaryDisabled && styles.disabled]}
        disabled={secondaryDisabled}
        onPress={onSecondaryPress}
      >
        <Ionicons name="create-outline" size={18} color="#6d28d9" />
        <Text style={styles.secondaryText}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  );
}
