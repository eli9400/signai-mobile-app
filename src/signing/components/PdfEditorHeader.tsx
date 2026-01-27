import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  subtitle?: string | null;

  isFullScreen: boolean;
  onToggleFullScreen: () => void;

  onClose: () => void;
};

export default function PdfEditorHeader({
  title,
  subtitle,
  isFullScreen,
  onToggleFullScreen,
  onClose,
}: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeTop}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.rightActions}>
            <Pressable style={styles.iconBtn} onPress={onToggleFullScreen}>
              <Text style={styles.iconBtnText}>
                {isFullScreen ? "🔍➖" : "🔍➕"}
              </Text>
            </Pressable>

            <Pressable style={styles.iconBtn} onPress={onClose}>
              <Text style={styles.iconBtnText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {!!subtitle && <Text style={styles.subTitle}>{subtitle}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeTop: {
    backgroundColor: "#000",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },

  rightActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  iconBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
});
