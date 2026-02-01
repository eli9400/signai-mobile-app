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
  Pressable,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { usePdfDocument } from "../signing/hooks/usePdfDocument";
import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";
import PdfPagesGrid from "../signing/pdfFlow/PdfPagesGrid";
import PdfPageEditor from "../signing/pdfFlow/PdfPageEditor";
import { Dimensions, Image } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import MultiPagePdfConverter from "../signing/pdf/MultiPagePdfConverter";
import { savePdfAndShare } from "../signing/export/exportAndSharePdf";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
};

type Point = { x: number; y: number };
type Size = { w: number; h: number };

export type PageEditState = {
  pageNumber: number;

  sigEnabled: boolean;
  sigItems: { id: string; pos: Point; size: Size }[];
  activeSigId: string | null;

  name1: string;
  name1Pos: Point;
  name1Font: number;

  name2: string;
  name2Pos: Point;
  name2Font: number;
};

type ExportPageData = {
  pageNumber: number;
  imageBase64: string; // filled after capture
  width: number;
  height: number;
  selected: boolean;
};

export default function SignPdfScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const doc = usePdfDocument();
  const autoPickedRef = useRef(false);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportPages, setExportPages] = useState<ExportPageData[]>([]);
  const [exportActivePage, setExportActivePage] = useState<number | null>(null);

  const [exportPngDataUrl, setExportPngDataUrl] = useState<string | null>(null);
  const [exportPngMeta, setExportPngMeta] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [exportStageSize, setExportStageSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  const exportStageRef = useRef<View>(null);

  const exportTotal = exportPages.length;
  const exportDone = useMemo(
    () => exportPages.filter((p) => !!p.imageBase64).length,
    [exportPages],
  );
  const exportPct = exportTotal
    ? Math.round((exportDone / exportTotal) * 100)
    : 0;

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

  const [view, setView] = useState<"grid" | "editor">("grid");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [activePage, setActivePage] = useState<number>(1);
  const [pageEdits, setPageEdits] = useState<Record<number, PageEditState>>({});
  const [totalPages, setTotalPages] = useState<number>(0);

  // ✅ Lift thumbnails state here so it persists between grid/editor views
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  const pdfBase64 = doc.pdf?.base64 ?? null;
  const pdfName = doc.pdf?.name ?? null;
  const hasPdf = Boolean(doc.pdf?.uri);
  const [readyPdfBase64, setReadyPdfBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!isExportingPdf) return;
    if (exportActivePage !== null) return;

    // finished capturing all pages => render converter
    // MultiPagePdfConverter will call onPdfReady
  }, [isExportingPdf, exportActivePage]);

  useEffect(() => {
    if (!totalPages) return;
    setSelectedPages(
      new Set(Array.from({ length: totalPages }, (_, i) => i + 1)),
    );
  }, [totalPages]);

  useEffect(() => {
    if (!initialFileUri) return;
    doc.openPdfFromUri(initialFileUri);
  }, [initialFileUri]);

  useEffect(() => {
    if (!doc.pdf?.uri) return;
    onFileLoaded?.();
    setView("grid");
    setActivePage(1);
    setSelectedPages(new Set());
    setTotalPages(0);
    setPageEdits({});
    setThumbnails({}); // ✅ Reset thumbnails only when PDF changes
  }, [doc.pdf?.uri]);

  const subtitle = useMemo(() => {
    if (!pdfName) return null;
    return totalPages ? `${pdfName} • ${totalPages} דפים` : pdfName;
  }, [pdfName, totalPages]);

  const isLoading = doc.isBusy;
  const shouldDiscoverTotal = Boolean(pdfBase64) && totalPages === 0;

  const handleBackToGrid = useCallback((editState: PageEditState) => {
    setPageEdits((prev) => ({
      ...prev,
      [editState.pageNumber]: editState,
    }));
    setView("grid");
  }, []);

  const getPageEdit = useCallback(
    (pageNumber: number): PageEditState => {
      return (
        pageEdits[pageNumber] ?? {
          pageNumber,
          sigPos: { x: 20, y: 20 },
          sigSize: { w: 180, h: 90 },
          name1: "",
          name1Pos: { x: 20, y: 140 },
          name1Font: 28,
          name2: "",
          name2Pos: { x: 20, y: 210 },
          name2Font: 28,
        }
      );
    },
    [pageEdits],
  );

  const getImageSize = useCallback((uri: string) => {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (err) => reject(err),
      );
    });
  }, []);

  const confirmExitToHome = useCallback(() => {
    if (isExportingPdf) {
      Alert.alert("ייצוא פעיל", "אנחנו באמצע ייצוא. חכה שיסתיים או בטל.", [
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
      {
        text: "חזרה למסך הראשי",
        style: "destructive",
        onPress: onBack,
      },
    ]);
  }, [hasPdf, onBack]);

  const startExportPdf = useCallback(() => {
    if (isExportingPdf) return;
    if (!pdfBase64) return;

    const pages = Array.from(selectedPages)
      .slice()
      .sort((a, b) => a - b)
      .map((pageNumber) => ({
        pageNumber,
        imageBase64: "",
        width: 0,
        height: 0,
        selected: true,
      }));

    if (pages.length === 0) {
      Alert.alert("ייצוא PDF", "לא נבחרו עמודים לייצוא.");
      return;
    }

    setIsExportingPdf(true);
    setExportPages(pages);
    setExportActivePage(pages[0].pageNumber);
    setExportPngDataUrl(null);
    setExportPngMeta(null);
  }, [pdfBase64, selectedPages, isExportingPdf]);

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
  }, [view]);

  useEffect(() => {
    if (!isExportingPdf) return;
    if (!exportActivePage) return;
    if (!exportPngDataUrl || !exportPngMeta) return;
    if (!exportStageSize) return;
    if (!exportStageRef.current) return;

    let cancelled = false;

    const run = async () => {
      try {
        // 1) capture composed stage to PNG file
        const { captureRef } = await import("react-native-view-shot");

        if (!exportStageRef.current) throw new Error("export stage not ready");

        const uri = await captureRef(exportStageRef.current, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        } as any);

        if (cancelled) return;

        // 2) read base64 + size
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64" as any,
        });

        const size = await getImageSize(uri);

        if (cancelled) return;

        // 3) update exportPages
        setExportPages((prev) =>
          prev.map((p) =>
            p.pageNumber === exportActivePage
              ? {
                  ...p,
                  imageBase64: base64,
                  width: size.width,
                  height: size.height,
                }
              : p,
          ),
        );

        // 4) move to next page
        const idx = exportPages.findIndex(
          (p) => p.pageNumber === exportActivePage,
        );
        const next = exportPages[idx + 1]?.pageNumber ?? null;

        setExportPngDataUrl(null);
        setExportPngMeta(null);
        setExportActivePage(next);
      } catch (e: any) {
        Alert.alert("ייצוא PDF", e?.message ?? "שגיאה בזמן ייצוא");
        setIsExportingPdf(false);
        setExportActivePage(null);
        setExportPages([]);
        setExportPngDataUrl(null);
        setExportPngMeta(null);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // חשוב: אנחנו מסתמכים על exportPages בשביל next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isExportingPdf,
    exportActivePage,
    exportPngDataUrl,
    exportPngMeta,
    exportStageSize,
  ]);

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
          onClose={() => {}}
          initialEdit={getPageEdit(activePage)}
        />
      )}

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
      {/* ===== PDF Export Hidden Pipeline ===== */}
      {isExportingPdf && pdfBase64 && exportActivePage && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <PdfPageToPngWebView
            pdfBase64={pdfBase64}
            pageNumber={exportActivePage}
            onRendered={(dataUrl, meta) => {
              setExportPngDataUrl(String(dataUrl));
              setExportPngMeta({ width: meta.width, height: meta.height });
            }}
            onError={(m) => {
              Alert.alert("ייצוא PDF", m || "שגיאה ברינדור עמוד");
              setIsExportingPdf(false);
            }}
          />
        </View>
      )}

      {isExportingPdf && exportPngDataUrl && exportPngMeta && (
        <View
          style={{
            position: "absolute",
            left: -9999,
            top: -9999,
            width: Dimensions.get("window").width,
            height: Dimensions.get("window").height,
            opacity: 1,
          }}
        >
          {/* זה ה-stage שאנחנו מצלמים */}
          <View
            ref={exportStageRef}
            collapsable={false}
            style={{
              flex: 1,
              paddingHorizontal: 14,
              paddingTop: 8,
              paddingBottom: 10,
            }}
            onLayout={(e) => {
              setExportStageSize({
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              });
            }}
          >
            {/* רקע העמוד */}
            <Image
              source={{ uri: exportPngDataUrl }}
              style={{ flex: 1 }}
              resizeMode="contain"
            />

            {/* overlays – לפי מצב עריכה ששמור לעמוד */}
            {(() => {
              const pageNo = exportActivePage;
              if (!pageNo) return null;

              const edit = getPageEdit(pageNo);

              // מחשבים rect של contain כדי למקם overlays בדיוק כמו במצב עריכה
              const stageW = exportStageSize?.w ?? 0;
              const stageH = exportStageSize?.h ?? 0;
              const imgW = exportPngMeta.width;
              const imgH = exportPngMeta.height;

              if (!stageW || !stageH || !imgW || !imgH) return null;

              const s = Math.min(stageW / imgW, stageH / imgH);
              const rw = imgW * s;
              const rh = imgH * s;
              const rx = (stageW - rw) / 2;
              const ry = (stageH - rh) / 2;

              const abs = (p: { x: number; y: number }) => ({
                position: "absolute" as const,
                left: rx + p.x,
                top: ry + p.y,
              });

              return (
                <>
                  {Boolean(signatureUri) &&
                    edit.sigEnabled &&
                    (edit.sigItems ?? []).map((s) => (
                      <Image
                        key={s.id}
                        source={{ uri: signatureUri! }}
                        style={[
                          abs(s.pos),
                          { width: s.size.w, height: s.size.h },
                        ]}
                        resizeMode="contain"
                      />
                    ))}

                  {!!edit.name1?.trim() && (
                    <View style={abs(edit.name1Pos)}>
                      <Text
                        style={{
                          fontSize: edit.name1Font,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {edit.name1}
                      </Text>
                    </View>
                  )}

                  {!!edit.name2?.trim() && (
                    <View style={abs(edit.name2Pos)}>
                      <Text
                        style={{
                          fontSize: edit.name2Font,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {edit.name2}
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      )}

      {isExportingPdf &&
        exportActivePage === null &&
        exportPages.length > 0 && (
          <MultiPagePdfConverter
            pages={exportPages}
            onPdfReady={async (b64) => {
              try {
                const base = (pdfName || "signed-document").replace(
                  /\.(pdf)$/i,
                  "",
                );
                const outName = `${base}-signed.pdf`;

                await savePdfAndShare(b64, outName, "שתף PDF");

                setIsExportingPdf(false);
                setExportPages([]);
              } catch (e: any) {
                Alert.alert("ייצוא PDF", e?.message ?? "שגיאה בשיתוף PDF");
                setIsExportingPdf(false);
                setExportPages([]);
              }
            }}
            onError={(err) => {
              Alert.alert("ייצוא PDF", err || "שגיאה בהמרה ל-PDF");
              setIsExportingPdf(false);
              setExportPages([]);
            }}
          />
        )}
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

            <View style={{ height: 14 }} />

            <Pressable
              style={styles.exportCancelBtn}
              onPress={() => {
                Alert.alert("ביטול ייצוא", "לבטל את הייצוא הנוכחי?", [
                  { text: "המשך ייצוא", style: "cancel" },
                  {
                    text: "בטל ייצוא",
                    style: "destructive",
                    onPress: () => {
                      setIsExportingPdf(false);
                      setExportPages([]);
                      setExportActivePage(null);
                      setExportPngDataUrl(null);
                      setExportPngMeta(null);
                      setExportStageSize(null);
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.exportCancelText}>ביטול</Text>
            </Pressable>
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
  exportCancelBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  exportCancelText: {
    color: "#b91c1c",
    fontWeight: "900",
  },
});
