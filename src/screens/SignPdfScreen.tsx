import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";

type Props = {
  onBack: () => void;
};

export default function SignPdfScreen({ onBack }: Props) {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const [isPicking, setIsPicking] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [mode, setMode] = useState<"idle" | "rendering" | "image">("idle");

  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    width: number;
    height: number;
    pageNumber: number;
  } | null>(null);

  const readPdfAsBase64 = async (uri: string) => {
    setIsReading(true);
    try {
      // NOTE: in newer expo-file-system, EncodingType is deprecated.
      // "base64" works fine.
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as any,
      });
      return b64;
    } finally {
      setIsReading(false);
    }
  };

  const startRender = () => {
    if (!pdfBase64) {
      Alert.alert("אין נתונים", "ה-PDF עדיין לא נטען לבסיס64.");
      return;
    }
    setMode("rendering");
    setPngDataUrl(null);
    setMeta(null);
  };

  const backToIdle = () => {
    setMode("idle");
    setPngDataUrl(null);
    setMeta(null);
  };

  const pickPdf = async () => {
    try {
      setIsPicking(true);

      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;

      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      console.log("📄 PDF נבחר:", asset.name);
      console.log("📍 URI:", asset.uri);

      setPdfUri(asset.uri);
      setPdfName(asset.name ?? "document.pdf");

      setPageNumber(1);
      setMode("idle");
      setPngDataUrl(null);
      setMeta(null);
      setPdfBase64(null);

      const b64 = await readPdfAsBase64(asset.uri);

      // ✅ הוסף את זה:
      console.log("✅ Base64 נטען, אורך:", b64.length);
      console.log("🔍 תחילת Base64:", b64.substring(0, 50));

      setPdfBase64(b64);
      setMode("rendering");
    } catch (e: any) {
      console.error("❌ שגיאה:", e);
      Alert.alert("שגיאה", e?.message ?? "לא הצלחתי לבחור/לטעון PDF");
    } finally {
      setIsPicking(false);
    }
  };

  const canRender = Boolean(pdfBase64) && !isReading;

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => p + 1);

  // if user changes page while already having base64, we re-render (auto)
  const renderCurrentPage = () => {
    if (!pdfBase64) return;
    setMode("rendering");
    setPngDataUrl(null);
    setMeta(null);
  };

  const fileLabel = useMemo(() => {
    if (!pdfName) return null;
    return `קובץ: ${pdfName} | עמוד ${pageNumber}`;
  }, [pdfName, pageNumber]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>PDF → תמונה (MVP)</Text>
        <Text style={styles.sub}>
          בוחרים PDF → נטען ל-base64 → מרנדרים עמוד לתמונה אוטומטית. (בשלב הבא
          נניח חתימה על התמונה)
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={pickPdf}
          disabled={isPicking || isReading}
        >
          {isPicking || isReading ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={styles.btnText}>
                {isPicking ? "פותח…" : "טוען PDF…"}
              </Text>
            </View>
          ) : (
            <Text style={styles.btnText}>בחר PDF</Text>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.btn,
            styles.btnSecondary,
            !canRender && styles.btnDisabled,
          ]}
          onPress={startRender}
          disabled={!canRender}
        >
          <Text style={styles.btnText}>רנדר שוב</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.backBtn]} onPress={onBack}>
          <Text style={styles.btnText}>חזרה</Text>
        </Pressable>
      </View>

      {!!fileLabel && <Text style={styles.fileName}>{fileLabel}</Text>}

      <View style={styles.pageBar}>
        <Pressable
          style={[styles.pageBtn, pageNumber <= 1 && styles.btnDisabled]}
          onPress={() => {
            prevPage();
            // re-render after state update: do it with a tiny delay
            setTimeout(renderCurrentPage, 0);
          }}
          disabled={pageNumber <= 1 || !pdfBase64}
        >
          <Text style={styles.pageBtnText}>◀</Text>
        </Pressable>

        <Text style={styles.pageText}>עמוד {pageNumber}</Text>

        <Pressable
          style={[styles.pageBtn, !pdfBase64 && styles.btnDisabled]}
          onPress={() => {
            nextPage();
            setTimeout(renderCurrentPage, 0);
          }}
          disabled={!pdfBase64}
        >
          <Text style={styles.pageBtnText}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.viewer}>
        {!pdfUri ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>אין PDF עדיין</Text>
            <Text style={styles.emptySub}>בחר PDF כדי להתחיל.</Text>
          </View>
        ) : mode === "rendering" ? (
          <>
            {!pdfBase64 ? (
              <View style={styles.empty}>
                <ActivityIndicator />
                <Text style={styles.emptySub}>טוען PDF…</Text>
              </View>
            ) : (
              <PdfPageToPngWebView
                pdfBase64={pdfBase64}
                pageNumber={pageNumber}
                onRendered={(dataUrl, m) => {
                  setPngDataUrl(dataUrl);
                  setMeta(m);
                  setMode("image");
                }}
                onError={(message) => {
                  console.log("render error:", message);
                  Alert.alert("שגיאת רנדר", message);
                  setMode("idle");
                }}
              />
            )}

            <View style={styles.renderFooter}>
              <ActivityIndicator />
              <Text style={styles.renderText}>מרנדר עמוד {pageNumber}…</Text>
              <Pressable style={styles.smallBtn} onPress={backToIdle}>
                <Text style={styles.smallBtnText}>בטל</Text>
              </Pressable>
            </View>
          </>
        ) : mode === "image" && pngDataUrl ? (
          <>
            <Image
              source={{ uri: pngDataUrl }}
              style={styles.image}
              resizeMode="contain"
            />
            <View style={styles.imageFooter}>
              <Text style={styles.metaText}>
                PNG: {meta?.width}×{meta?.height} (עמוד {meta?.pageNumber})
              </Text>
              <Pressable style={styles.smallBtn} onPress={backToIdle}>
                <Text style={styles.smallBtnText}>חזור</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>מוכן</Text>
            <Text style={styles.emptySub}>בחר “רנדר שוב” או בחר PDF חדש.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b", padding: 16 },

  header: { gap: 6, marginBottom: 12 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "white", opacity: 0.7, lineHeight: 18 },

  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  btn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: { backgroundColor: "#3a3a3a" },
  backBtn: { backgroundColor: "#1b1b1b" },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "white", fontWeight: "700", textAlign: "center" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },

  fileName: { color: "white", opacity: 0.75, marginBottom: 10 },

  pageBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  pageBtn: {
    width: 52,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#1f1f1f",
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
  pageText: { color: "white", opacity: 0.8, fontWeight: "700" },

  viewer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  emptyTitle: { color: "white", fontSize: 18, fontWeight: "700", opacity: 0.9 },
  emptySub: { color: "white", opacity: 0.6, textAlign: "center" },

  image: { flex: 1, width: "100%", height: "100%" },

  renderFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  renderText: { color: "white", fontWeight: "700" },

  imageFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: { color: "white", opacity: 0.85 },

  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  smallBtnText: { color: "white", fontWeight: "800" },
});
