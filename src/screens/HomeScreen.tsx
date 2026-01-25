// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  signatureUri: string | null;
  onGoSignature: () => void;
  onGoSignImage: () => void;
  onGoSignPdf: () => void;
};

export default function HomeScreen({
  signatureUri,
  onGoSignature,
  onGoSignImage,
  onGoSignPdf,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>QuickSign</Text>
          <Text style={styles.subtitle}>חתימה דיגיטלית מהירה</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>החתימה שלך</Text>

          {signatureUri ? (
            <View style={styles.sigContainer}>
              <Image
                source={{ uri: signatureUri }}
                style={styles.sigPreview}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.emptySig}>
              <Text style={styles.emptyIcon}>✍️</Text>
              <Text style={styles.emptyText}>אין חתימה שמורה</Text>
            </View>
          )}

          <Pressable style={styles.updateBtn} onPress={onGoSignature}>
            <Text style={styles.updateBtnText}>
              {signatureUri ? "עדכן חתימה" : "צור חתימה"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.actionsGroup}>
          <Text style={styles.groupTitle}>בחר מסמך לחתימה</Text>

          <Pressable
            style={[styles.actionBtn, !signatureUri && styles.btnDisabled]}
            onPress={() => signatureUri && onGoSignImage()}
            disabled={!signatureUri}
          >
            <Text style={styles.btnIcon}>🖼️</Text>
            <View style={styles.btnContent}>
              <Text style={styles.btnTitle}>תמונה</Text>
              <Text style={styles.btnSubtitle}>הוסף חתימה לתמונה</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, !signatureUri && styles.btnDisabled]}
            onPress={() => signatureUri && onGoSignPdf()}
            disabled={!signatureUri}
          >
            <Text style={styles.btnIcon}>📄</Text>
            <View style={styles.btnContent}>
              <Text style={styles.btnTitle}>PDF</Text>
              <Text style={styles.btnSubtitle}>חתום על מסמך PDF</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>

        {!signatureUri && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              💡 צור חתימה תחילה כדי להתחיל לחתום על מסמכים
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, padding: 20, gap: 24 },

  header: {
    gap: 4,
    paddingTop: 12,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  sigContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    height: 120,
  },
  sigPreview: {
    width: "100%",
    height: "100%",
  },

  emptySig: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },

  updateBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  actionsGroup: {
    gap: 12,
  },
  groupTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  actionBtn: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnIcon: {
    fontSize: 28,
  },
  btnContent: {
    flex: 1,
    gap: 2,
  },
  btnTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  btnSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  arrow: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 20,
    fontWeight: "700",
  },

  notice: {
    backgroundColor: "rgba(0,122,255,0.15)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.3)",
  },
  noticeText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
});
