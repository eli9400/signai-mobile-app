import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { styles } from "./ImageEditor.styles";

type Props = {
  open: boolean;
  title: string;
  hint: string;
};

export default function ImageEditorExportLoading({ open, title, hint }: Props) {
  if (!open) return null;

  return (
    <View style={styles.exportLoadingOverlay}>
      <View style={styles.exportLoadingCard}>
        <View style={styles.exportLoadingSpinner}>
          <ActivityIndicator size="large" color="#6d28d9" />
        </View>
        <Text style={styles.exportLoadingText}>{title}</Text>
        <Text style={styles.exportLoadingHint}>{hint}</Text>
      </View>
    </View>
  );
}
