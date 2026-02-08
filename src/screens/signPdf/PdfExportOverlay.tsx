import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  open: boolean;
  title: string;
  progressLabel: string;
  workingLabel: string;
};

export default function PdfExportOverlay({
  open,
  title,
  progressLabel,
  workingLabel,
}: Props) {
  if (!open) return null;

  return (
    <View style={styles.exportOverlay} pointerEvents="auto">
      <View style={styles.exportCard}>
        <Text style={styles.exportTitle}>{title}</Text>

        <View style={{ height: 12 }} />
        <ActivityIndicator />
        <View style={{ height: 12 }} />

        <Text style={styles.exportSub}>{progressLabel}</Text>

        <View style={{ height: 6 }} />

        <Text style={[styles.exportSub, { opacity: 0.7 }]}>
          {workingLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exportOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 16,
  },
  exportCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 16,
    elevation: 6,
  },
  exportTitle: { fontSize: 18, fontWeight: "900" },
  exportSub: { fontSize: 13, fontWeight: "700", opacity: 0.9 },
});
