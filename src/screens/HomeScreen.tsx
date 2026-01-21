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
        <Text style={styles.title}>SignAI MVP</Text>

        <View style={styles.card}>
          <Text style={styles.label}>חתימה שמורה:</Text>

          {signatureUri ? (
            <Image
              source={{ uri: signatureUri }}
              style={styles.sigPreview}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.muted}>אין חתימה עדיין</Text>
          )}
        </View>

        <Pressable style={styles.btn} onPress={onGoSignature}>
          <Text style={styles.btnText}>צייר/עדכן חתימה</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, !signatureUri && styles.btnDisabled]}
          onPress={() => signatureUri && onGoSignImage()}
          disabled={!signatureUri}
        >
          <Text style={styles.btnText}>בחר תמונה וחתום</Text>
        </Pressable>

        <Pressable
          style={[
            styles.btn,
            styles.btnSecondary,
            !signatureUri && styles.btnDisabled,
          ]}
          onPress={() => signatureUri && onGoSignPdf()}
          disabled={!signatureUri}
        >
          <Text style={styles.btnText}>בחר PDF וחתום</Text>
        </Pressable>

        <Text style={styles.note}>
          PDF כרגע עובד במצב MVP: אנחנו ממירים עמוד לתמונה, ובשלב הבא נניח עליו
          חתימה/שמות.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b" },
  container: { flex: 1, padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "700", marginTop: 8 },

  card: { backgroundColor: "#161616", borderRadius: 16, padding: 12, gap: 8 },
  label: { color: "white", fontSize: 14, opacity: 0.9 },
  muted: { color: "white", opacity: 0.6 },

  sigPreview: {
    width: "100%",
    height: 90,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },

  btn: {
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSecondary: { backgroundColor: "#3a3a3a" },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },

  note: { color: "white", opacity: 0.6, marginTop: 8, lineHeight: 18 },
});
