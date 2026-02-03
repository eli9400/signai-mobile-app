// src/screens/SignPdfScreen.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Platform,
  BackHandler,
  Alert,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { usePdfDocument } from "../signing/hooks/usePdfDocument";
import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";
import PdfPagesGrid from "../signing/pdfFlow/PdfPagesGrid";
import PdfPageEditor from "../signing/pdfFlow/PdfPageEditor";
import * as FileSystem from "expo-file-system/legacy";
import { savePdfAndShare } from "../signing/export/exportAndSharePdf";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
};

// Normalized coordinates (0..1) relative to the PAGE content box
export type NormPoint = { x: number; y: number };
export type NormSize = { w: number; h: number };

export type PageEditState = {
  pageNumber: number;

  sigEnabled: boolean;
  sigItems: { id: string; pos: NormPoint; size: NormSize }[];
  activeSigId: string | null;

  name1: string;
  name1Pos: NormPoint;
  name1FontN: number; // normalized relative to page width (e.g., 0.03)

  name2: string;
  name2Pos: NormPoint;
  name2FontN: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Base64 helpers (Expo/RN usually have atob/btoa)
const base64ToUint8 = (b64: string) => {
  const bin = globalThis.atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const uint8ToBase64 = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return globalThis.btoa(bin);
};

function extractBase64FromDataUrl(dataUrl: string) {
  // data:image/png;base64,AAAA...
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) throw new Error("Invalid data URL");
  return dataUrl.slice(idx + "base64,".length);
}

async function readUriAsBase64(uriOrDataUrl: string) {
  if (!uriOrDataUrl) throw new Error("Empty uri");

  // If it's already a data URL, just extract base64 directly
  if (uriOrDataUrl.startsWith("data:")) {
    return extractBase64FromDataUrl(uriOrDataUrl);
  }

  // Otherwise, assume it's a file uri (file://, content:// etc.)
  return FileSystem.readAsStringAsync(uriOrDataUrl, {
    encoding: "base64" as any,
  });
}

export default function SignPdfScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const doc = usePdfDocument();
  const autoPickedRef = useRef(false);

  const [view, setView] = useState<"grid" | "editor">("grid");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [activePage, setActivePage] = useState<number>(1);
  const [pageEdits, setPageEdits] = useState<Record<number, PageEditState>>({});
  const [totalPages, setTotalPages] = useState<number>(0);

  // thumbnails state persists between grid/editor views
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const pdfBase64 = doc.pdf?.base64 ?? null;
  const pdfName = doc.pdf?.name ?? null;
  const hasPdf = Boolean(doc.pdf?.uri);
  const [exportTotal, setExportTotal] = useState(0);
  const [exportDone, setExportDone] = useState(0);

  const exportPct = exportTotal
    ? Math.round((exportDone / exportTotal) * 100)
    : 0;

  // Auto-pick PDF on mobile (if no initial file)
  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    if (initialFileUri) return;
    if (doc.pdf?.uri) return;
    if (autoPickedRef.current) return;
    if (doc.isBusy) return;

    autoPickedRef.current = true;
    setTimeout(() => {
      doc.pickPdf();
    }, 50);
  }, [initialFileUri, doc.pdf?.uri, doc.isBusy, doc.pickPdf]);

  // Select all pages once total is known
  useEffect(() => {
    if (!totalPages) return;
    setSelectedPages(
      new Set(Array.from({ length: totalPages }, (_, i) => i + 1)),
    );
  }, [totalPages]);

  // Open initial file if passed
  useEffect(() => {
    if (!initialFileUri) return;
    doc.openPdfFromUri(initialFileUri);
  }, [initialFileUri, doc.openPdfFromUri]);

  // Reset state when PDF changes
  useEffect(() => {
    if (!doc.pdf?.uri) return;
    onFileLoaded?.();
    setView("grid");
    setActivePage(1);
    setSelectedPages(new Set());
    setTotalPages(0);
    setPageEdits({});
    setThumbnails({});
  }, [doc.pdf?.uri, onFileLoaded]);

  const subtitle = useMemo(() => {
    if (!pdfName) return null;
    return totalPages ? `${pdfName} • ${totalPages} דפים` : pdfName;
  }, [pdfName, totalPages]);

  const isLoading = doc.isBusy;
  const shouldDiscoverTotal = Boolean(pdfBase64) && totalPages === 0;

  const getPageEdit = useCallback(
    (pageNumber: number): PageEditState => {
      // Defaults in normalized units (roughly matches your old px defaults)
      return (
        pageEdits[pageNumber] ?? {
          pageNumber,

          sigEnabled: true,
          sigItems: [],
          activeSigId: null,

          name1: "",
          name1Pos: { x: 0.03, y: 0.16 },
          name1FontN: 0.03, // ~30px if page width ~1000px

          name2: "",
          name2Pos: { x: 0.03, y: 0.24 },
          name2FontN: 0.03,
        }
      );
    },
    [pageEdits],
  );

  const handleBackToGrid = useCallback((editState: PageEditState) => {
    setPageEdits((prev) => ({
      ...prev,
      [editState.pageNumber]: editState,
    }));
    setView("grid");
  }, []);

  const confirmExitToHome = useCallback(() => {
    if (isExportingPdf) {
      Alert.alert("ייצוא פעיל", "אנחנו באמצע ייצוא. חכה שיסתיים.", [
        { text: "אוקי" },
      ]);
      return;
    }

    if (!hasPdf) {
      onBack();
      return;
    }

    Alert.alert("יציאה מהמסמך", "האם לחזור למסך הראשי?", [
      { text: "ביטול", style: "cancel" },
      { text: "חזרה למסך הראשי", style: "destructive", onPress: onBack },
    ]);
  }, [hasPdf, onBack, isExportingPdf]);

  // Android hardware back
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBack = () => {
      if (isExportingPdf) return true;

      if (view === "editor") {
        setView("grid");
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );
    return () => sub.remove();
  }, [view, isExportingPdf]);

  // --------- PDF stamping export (Route B) ---------
  const exportStampedPdf = useCallback(
    async (
      pagesToExport: number[],
      onProgress?: (done: number, total: number) => void,
    ) => {
      if (!pdfBase64) throw new Error("PDF not loaded");

      const pdfDoc = await PDFDocument.load(base64ToUint8(pdfBase64));
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const textColor = rgb(0.06, 0.09, 0.16);

      const total = pagesToExport.length;
      let done = 0;

      // Embed signature image once (optional)
      let sigImg: any = null;
      if (signatureUri) {
        const sigB64 = await readUriAsBase64(signatureUri); // supports data: + file:
        const sigBytes = base64ToUint8(sigB64);

        try {
          sigImg = await pdfDoc.embedPng(sigBytes);
        } catch {
          sigImg = await pdfDoc.embedJpg(sigBytes);
        }
      }

      for (const pageNo of pagesToExport) {
        const pageIndex = pageNo - 1;
        const page = pdfDoc.getPage(pageIndex);
        const { width: pw, height: ph } = page.getSize();

        const edit = pageEdits[pageNo];
        if (edit) {
          // --- Signatures ---
          if (sigImg && edit.sigEnabled) {
            for (const s of edit.sigItems ?? []) {
              const w = clamp01(s.size.w) * pw;
              const h = clamp01(s.size.h) * ph;

              const x = clamp01(s.pos.x) * pw;
              const yTop = clamp01(s.pos.y) * ph; // top-origin
              const y = ph - yTop - h; // -> PDF origin (bottom-left)

              page.drawImage(sigImg, { x, y, width: w, height: h });
            }
          }

          // --- Text helper ---
          const drawName = (txt: string, pos: NormPoint, fontN: number) => {
            const t = (txt ?? "").trim();
            if (!t) return;

            const fontSize = Math.max(8, Math.round(clamp01(fontN) * pw));
            const x = clamp01(pos.x) * pw;
            const yTop = clamp01(pos.y) * ph;
            const y = ph - yTop;

            page.drawText(t, {
              x,
              y: y - fontSize, // baseline nudge
              size: fontSize,
              font,
              color: textColor,
            });
          };

          if (edit.name1?.trim()) {
            drawName(edit.name1, edit.name1Pos, edit.name1FontN);
          }
          if (edit.name2?.trim()) {
            drawName(edit.name2, edit.name2Pos, edit.name2FontN);
          }
        }

        // progress + allow UI to repaint
        done += 1;
        onProgress?.(done, total);
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      }

      const outBytes = await pdfDoc.save();
      return uint8ToBase64(outBytes);
    },
    [pdfBase64, pageEdits, signatureUri],
  );

  const startExportPdf = useCallback(async () => {
    if (isExportingPdf) return;
    if (!pdfBase64) return;

    const pages = Array.from(selectedPages)
      .slice()
      .sort((a, b) => a - b);

    if (pages.length === 0) {
      Alert.alert("ייצוא PDF", "לא נבחרו עמודים לייצוא.");
      return;
    }

    try {
      setIsExportingPdf(true);
      setExportTotal(pages.length);
      setExportDone(0);

      const outB64 = await exportStampedPdf(pages, (d, t) => {
        setExportDone(d);
        setExportTotal(t);
      });

      const base = (pdfName || "signed-document").replace(/\.(pdf)$/i, "");
      const outName = `${base}-signed.pdf`;

      await savePdfAndShare(outB64, outName, "שתף PDF");
    } catch (e: any) {
      Alert.alert("ייצוא PDF", e?.message ?? "שגיאה בזמן ייצוא");
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, pdfBase64, selectedPages, exportStampedPdf, pdfName]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {view === "grid" ? (
        <PdfPagesGrid
          subtitle={subtitle}
          pdfReady={Boolean(pdfBase64)}
          isLoading={isLoading || shouldDiscoverTotal}
          onClose={confirmExitToHome}
          onPickPdf={doc.pickPdf}
          totalPages={totalPages}
          onExportPdf={startExportPdf}
          selectedPages={selectedPages}
          setSelectedPages={setSelectedPages}
          onOpenPage={(pageNumber) => {
            setActivePage(pageNumber);
            setView("editor");
          }}
          pdfBase64={pdfBase64 ?? undefined}
          thumbnails={thumbnails}
          setThumbnails={setThumbnails}
        />
      ) : (
        <PdfPageEditor
          title={`עמוד ${activePage}${totalPages ? ` מתוך ${totalPages}` : ""}`}
          onBackToGrid={handleBackToGrid}
          pdfBase64={pdfBase64}
          pageNumber={activePage}
          signatureUri={signatureUri}
          initialEdit={getPageEdit(activePage)}
        />
      )}

      {/* Discover total pages (hidden render of page 1) */}
      {shouldDiscoverTotal && pdfBase64 && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <PdfPageToPngWebView
            pdfBase64={pdfBase64}
            pageNumber={1}
            onRendered={(_, meta) => {
              const t = Number((meta as any).totalPages ?? 0);
              if (t > 0) setTotalPages(t);
            }}
            onError={() => {}}
          />
        </View>
      )}

      {/* Export overlay */}
      {isExportingPdf && (
        <View style={styles.exportOverlay} pointerEvents="auto">
          <View style={styles.exportCard}>
            <Text style={styles.exportTitle}>מייצא PDF…</Text>

            <View style={{ height: 12 }} />

            <ActivityIndicator />

            <View style={{ height: 12 }} />

            <Text style={styles.exportSub}>
              עמודים: {exportDone} / {exportTotal} ({exportPct}%)
            </Text>

            <View style={{ height: 6 }} />

            <Text style={[styles.exportSub, { opacity: 0.7 }]}>
              הפעולה מתבצעת…
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exportOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  exportCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "right",
  },
  exportSub: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
  },
});
