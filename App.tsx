import React, { useEffect, useState } from "react";
import {

  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { loadSignaturePngUri } from "./src/storage/signatureStore";
import SignatureScreen from "./src/screens/SignatureScreen";
import SignImageScreen from "./src/screens/SignImageScreen";
import { SafeAreaView } from "react-native-safe-area-context";


type Screen = "home" | "signature" | "signImage";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const uri = await loadSignaturePngUri();
      setSignatureUri(uri);
    })();
  }, [screen]);

  if (screen === "signature") {
    return <SignatureScreen onDone={() => setScreen("home")} />;
  }

  if (screen === "signImage") {
    return (
      <SignImageScreen
        signatureUri={signatureUri}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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

        <Pressable style={styles.btn} onPress={() => setScreen("signature")}>
          <Text style={styles.btnText}>צייר/עדכן חתימה</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, !signatureUri && styles.btnDisabled]}
          onPress={() => signatureUri && setScreen("signImage")}
          disabled={!signatureUri}
        >
          <Text style={styles.btnText}>בחר תמונה וחתום</Text>
        </Pressable>

        <Text style={styles.note}>
          בשלב הראשון אנחנו חותמים על תמונות. PDF נכניס אחרי שהכול עובד חלק.
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
    backgroundColor: "#ffffff", // ✅ משטח לבן כדי לראות חתימה שחורה
    borderRadius: 12,
  },

  btn: {
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
  note: { color: "white", opacity: 0.6, marginTop: 8, lineHeight: 18 },
});
