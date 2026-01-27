// src/screens/SignPdfScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SizeControls from "../signing/components/SizeControls";
import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";
import MultiPagePdfConverter from "../signing/pdf/MultiPagePdfConverter";
import PageSelectorModal from "../signing/components/PageSelectorModal";
import SigningToolbar from "../signing/components/SigningToolbar";
import SignatureOverlay from "../signing/components/SignatureOverlay";
import TextOverlay from "../signing/components/TextOverlay";
import { useOverlayGestures } from "../signing/hooks/useOverlayGestures";
import { usePdfEditor } from "../signing/hooks/usePdfEditor";
import { savePdfAndShare } from "../signing/export/exportAndSharePdf";
import {
  calcImageBox,
  clampPosInsideBox,
  clampPosLoose,
  type Rect,
} from "../signing/geometry";
import PdfEditorHeader from "../signing/components/PdfEditorHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildAllPagesForSelector,
  makeExportQueue,
  nextMissing,
  progress,
  toggleSelectorPage,
  updateQueueWithRenderedPage,
  type ExportPage,
} from "../signing/pdf/multiPageExportPrep";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null; // <-- חדש (Open with)
  onFileLoaded?: () => void;
};

export default function SignPdfScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const editor = usePdfEditor(signatureUri);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectorPages, setSelectorPages] = useState<ExportPage[]>([]);
  const [exportPages, setExportPages] = useState<ExportPage[]>([]);
  const exportQueueRef = useRef<ExportPage[]>([]);

  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [preparePageNumber, setPreparePageNumber] = useState<number | null>(
    null,
  );
  const [prepareProgress, setPrepareProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (!initialFileUri) return;

    // Load incoming PDF from "Open with"
    editor.openPdfFromUri(initialFileUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFileUri]);

  useEffect(() => {
    if (editor.pdfUri) onFileLoaded?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.pdfUri]);

  const minSigW = 45;
  const maxSigW = 260;
  const minFont = 10;
  const maxFont = 54;

  const resizeSignature = (dir: -1 | 1) => {
    const step = 10;
    const nextW = Math.max(
      minSigW,
      Math.min(maxSigW, editor.sigSize.w + dir * step),
    );

    const ratio =
      editor.sigSize.w > 0 ? editor.sigSize.h / editor.sigSize.w : 0.5;
    const nextH = nextW * ratio;

    editor.setSigSize({ w: nextW, h: nextH });
  };

  const resizeText = (dir: -1 | 1) => {
    const step = 1;

    const next1 = Math.max(
      minFont,
      Math.min(maxFont, editor.name1Font + dir * step),
    );
    const next2 = Math.max(
      minFont,
      Math.min(maxFont, editor.name2Font + dir * step),
    );

    editor.setName1Font(next1);
    editor.setName2Font(next2);
  };

  const imageBox: Rect | null = useMemo(() => {
    if (!editor.pngMeta) return null;
    return calcImageBox(
      editor.containerW,
      editor.containerH,
      editor.pngMeta.width,
      editor.pngMeta.height,
    );
  }, [editor.pngMeta, editor.containerW, editor.containerH]);

  useEffect(() => {
    if (!imageBox) return;
    editor.setSigPos((p) =>
      clampPosInsideBox(p, imageBox, editor.sigSize.w, editor.sigSize.h),
    );
    editor.setName1Pos((p) => clampPosLoose(p, imageBox, 40));
    editor.setName2Pos((p) => clampPosLoose(p, imageBox, 40));
  }, [imageBox, editor.sigSize.w, editor.sigSize.h]);
  const insets = useSafeAreaInsets();

  const {
    pinch,
    onOverlayGrant,
    onOverlayMove,
    onOverlayEnd,
    isInteractingSig,
    isInteractingName1,
    isInteractingName2,
  } = useOverlayGestures({
    imageBox,
    isDisabled: editor.isExporting || editor.mode !== "editing",
    isPinchEnabled: false,

    sigSize: editor.sigSize,
    setSigSize: editor.setSigSize,
    sigPos: editor.sigPos,
    setSigPos: editor.setSigPos,
    minSigW,
    maxSigW,

    name1Pos: editor.name1Pos,
    setName1Pos: editor.setName1Pos,
    name1Font: editor.name1Font,
    setName1Font: editor.setName1Font,

    name2Pos: editor.name2Pos,
    setName2Pos: editor.setName2Pos,
    name2Font: editor.name2Font,
    setName2Font: editor.setName2Font,

    minFont,
    maxFont,

    textClampPadding: 40,
  });

  const handleExport = async () => {
    if (!editor.canExport) {
      Alert.alert("אין תמונה", "המתן שהדף יירנדר לפני ייצוא.");
      return;
    }

    try {
      Keyboard.dismiss();
      editor.setIsExporting(true);

      // Save current page
      const currentPage = await editor.saveCurrentPage();
      if (!currentPage) {
        throw new Error("לא הצלחתי לשמור את העמוד הנוכחי");
      }

      // Update or add current page
      editor.setEditedPages((prev) => {
        const existing = prev.findIndex(
          (p) => p.pageNumber === editor.pageNumber,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = currentPage;
          return updated;
        }
        return [...prev, currentPage].sort(
          (a, b) => a.pageNumber - b.pageNumber,
        );
      });

      // If single page, export directly
      if (!editor.totalPages || editor.totalPages === 1) {
        editor.setIsConverting(true);
        // Will be handled by MultiPagePdfConverter
      } else {
        // ✅ Multi-page: show selector with ALL pages by default
        const total = editor.totalPages ?? 0;

        // combine current page (just saved) + existing editedPages
        const mergedEdited = [
          ...(editor.editedPages as any),
          currentPage as any,
        ];

        // remove duplicates by pageNumber (keep latest)
        const byNum = new Map<number, any>();
        for (const p of mergedEdited) byNum.set(p.pageNumber, p);
        const uniqueEdited = Array.from(byNum.values());

        const allPages = buildAllPagesForSelector(total, uniqueEdited);

        setSelectorPages(allPages);
        editor.setShowPageSelector(true);
        editor.setIsExporting(false);
      }
    } catch (e: any) {
      Alert.alert("שגיאה בייצוא", e?.message ?? "לא הצלחתי לייצא");
      editor.setIsExporting(false);
    }
  };

  const handleMultiPageExport = () => {
    const selected = selectorPages
      .filter((p) => p.selected)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    if (selected.length === 0) {
      Alert.alert("שגיאה", "בחר לפחות עמוד אחד לייצוא");
      return;
    }

    // ניצור תור ייצוא (כולל עמודים לא-ערוכים)
    exportQueueRef.current = selected.map((p) => ({ ...p }));

    const done = exportQueueRef.current.filter((p) => p.imageBase64).length;
    setPrepareProgress({ done, total: exportQueueRef.current.length });

    editor.setShowPageSelector(false);
    editor.setIsExporting(true);

    const missing = exportQueueRef.current.find((p) => !p.imageBase64);
    if (!missing) {
      // הכל כבר מוכן (למשל המשתמש ערך את כולם)
      setExportPages(exportQueueRef.current);
      editor.setIsConverting(true);
      return;
    }

    // מתחילים להכין עמודים חסרים אחד-אחד
    setIsPreparingExport(true);
    setPreparePageNumber(missing.pageNumber);
  };

  const handlePdfReady = async (pdfBase64: string) => {
    try {
      await savePdfAndShare(
        pdfBase64,
        editor.pdfName ?? "signed-document.pdf",
        "שתף PDF",
      );

      editor.setIsConverting(false);
      editor.setIsExporting(false);
    } catch (e: any) {
      Alert.alert("שגיאה בשמירת PDF", e?.message ?? "לא הצלחתי לשמור את ה-PDF");
      editor.setIsConverting(false);
      editor.setIsExporting(false);
    }
  };

  const handlePdfError = (error: string) => {
    Alert.alert("שגיאה בהמרת PDF", error);
    editor.setIsConverting(false);
    editor.setIsExporting(false);
  };

  const cleanFileLabel = useMemo(() => {
    if (!editor.fileLabel) return null;

    // remove any existing "עמוד X מתוך Y" from fileLabel to avoid duplicates
    return editor.fileLabel.replace(/\s*\|\s*עמוד\s+\d+\s+מתוך\s+\d+\s*$/g, "");
  }, [editor.fileLabel]);

  const onToggleSelectorPage = (pageNum: number) => {
    setSelectorPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNum ? { ...p, selected: !p.selected } : p,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <PdfEditorHeader
        title="עריכת PDF"
        subtitle={
          cleanFileLabel
            ? `${cleanFileLabel}${
                editor.totalPages
                  ? ` | עמוד ${editor.pageNumber} מתוך ${editor.totalPages}`
                  : ""
              }`
            : null
        }
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen((v) => !v)}
        onClose={onBack}
      />

      {/* Toolbar or Actions */}
      {!isFullScreen && (
        <>
          {editor.mode === "editing" ? (
            <>
              <SigningToolbar
                name1={editor.name1}
                name2={editor.name2}
                setName1={editor.setName1}
                setName2={editor.setName2}
                isExporting={editor.isExporting}
                canExport={Boolean(editor.canExport)}
                onPickImage={editor.pickPdf}
                onExport={handleExport}
                onBack={onBack}
                mode="pdf"
                pickButtonLabel="טען PDF אחר"
              />

              <View style={styles.sizeRow}>
                <View style={styles.sizeChip}>
                  <Text style={styles.sizeChipText}>גודל</Text>
                </View>

                <SizeControls
                  disabled={editor.isExporting}
                  onSigMinus={() => resizeSignature(-1)}
                  onSigPlus={() => resizeSignature(1)}
                  onTextMinus={() => resizeText(-1)}
                  onTextPlus={() => resizeText(1)}
                />
              </View>
            </>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={editor.pickPdf}
                disabled={editor.isPicking || editor.isReading}
              >
                {editor.isPicking || editor.isReading ? (
                  <View style={styles.row}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.btnText}>
                      {editor.isPicking ? "פותח..." : "טוען..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.btnIcon}>📄</Text>
                    <Text style={styles.btnText}>בחר PDF</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Page Navigation */}
      {editor.mode === "editing" &&
        editor.totalPages &&
        editor.totalPages > 1 && (
          <View style={styles.pageNav}>
            <Pressable
              style={[
                styles.pageBtn,
                editor.pageNumber <= 1 && styles.pageBtnDisabled,
              ]}
              onPress={editor.prevPage}
              disabled={editor.pageNumber <= 1}
            >
              <Text style={styles.pageBtnIcon}>←</Text>
            </Pressable>

            <View style={styles.pageInfo}>
              <Text style={styles.pageText}>{editor.pageNumber}</Text>
              <Text style={styles.pageSep}>/</Text>
              <Text style={styles.pageTotalText}>{editor.totalPages}</Text>
              {editor.editedPages.some(
                (p) => p.pageNumber === editor.pageNumber,
              ) && <Text style={styles.savedIndicator}>✓</Text>}
            </View>

            <Pressable
              style={[
                styles.pageBtn,
                editor.pageNumber >= editor.totalPages &&
                  styles.pageBtnDisabled,
              ]}
              onPress={editor.nextPage}
              disabled={editor.pageNumber >= editor.totalPages}
            >
              <Text style={styles.pageBtnIcon}>→</Text>
            </Pressable>
          </View>
        )}

      {/* Viewer */}
      <View
        style={[styles.viewer, isFullScreen && styles.viewerFull]}
        onLayout={editor.onStageLayout}
        collapsable={false}
      >
        {!editor.pdfUri ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>בחר מסמך PDF</Text>
            <Text style={styles.emptySub}>
              תוכל להוסיף חתימה ושמות ולייצא חזרה כ-PDF
            </Text>
          </View>
        ) : editor.mode === "rendering" ? (
          <>
            {!editor.pdfBase64 ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.emptySub}>טוען PDF...</Text>
              </View>
            ) : (
              <PdfPageToPngWebView
                pdfBase64={editor.pdfBase64}
                pageNumber={editor.pageNumber}
                onRendered={(dataUrl, m) => {
                  editor.setPngDataUrl(dataUrl);
                  editor.setPngMeta({ width: m.width, height: m.height });
                  editor.setTotalPages(m.totalPages);
                  editor.setMode("editing");
                }}
                onError={(message) => {
                  Alert.alert("שגיאת רנדר", message);
                  editor.setMode("idle");
                }}
              />
            )}

            <View style={styles.renderOverlay}>
              <View style={styles.renderBox}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.renderText}>
                  מרנדר עמוד {editor.pageNumber}...
                </Text>
              </View>
            </View>
          </>
        ) : editor.mode === "editing" && editor.pngDataUrl && imageBox ? (
          <>
            <Image
              source={{ uri: editor.pngDataUrl }}
              style={styles.image}
              resizeMode="contain"
            />

            <View
              ref={editor.imageBoxRef}
              collapsable={false}
              style={[
                styles.imageBox,
                {
                  left: imageBox.x,
                  top: imageBox.y,
                  width: imageBox.w,
                  height: imageBox.h,
                },
              ]}
            >
              <Image
                source={{ uri: editor.pngDataUrl }}
                style={styles.imageBoxImg}
                resizeMode="cover"
              />

              {editor.canSign && signatureUri ? (
                <SignatureOverlay
                  signatureUri={signatureUri}
                  pos={editor.sigPos}
                  size={editor.sigSize}
                  isExporting={editor.isExporting}
                  isInteracting={isInteractingSig}
                  isPinching={pinch.isPinching}
                  onGrant={onOverlayGrant("sig")}
                  onMove={onOverlayMove}
                  onEnd={onOverlayEnd}
                />
              ) : null}

              <TextOverlay
                text={editor.name1}
                pos={editor.name1Pos}
                fontSize={editor.name1Font}
                isExporting={editor.isExporting}
                isInteracting={isInteractingName1}
                isPinching={pinch.isPinching}
                onGrant={onOverlayGrant("name1")}
                onMove={onOverlayMove}
                onEnd={onOverlayEnd}
              />

              <TextOverlay
                text={editor.name2}
                pos={editor.name2Pos}
                fontSize={editor.name2Font}
                isExporting={editor.isExporting}
                isInteracting={isInteractingName2}
                isPinching={pinch.isPinching}
                onGrant={onOverlayGrant("name2")}
                onMove={onOverlayMove}
                onEnd={onOverlayEnd}
              />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>מוכן</Text>
            <Text style={styles.emptySub}>בחר PDF כדי להתחיל.</Text>
          </View>
        )}
      </View>

      {isPreparingExport && editor.pdfBase64 && preparePageNumber && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <PdfPageToPngWebView
            pdfBase64={editor.pdfBase64}
            pageNumber={preparePageNumber}
            onRendered={(dataUrl, m) => {
              const b64 = String(dataUrl).split(",")[1] ?? "";

              exportQueueRef.current = exportQueueRef.current.map((p) =>
                p.pageNumber === m.pageNumber
                  ? { ...p, imageBase64: b64, width: m.width, height: m.height }
                  : p,
              );

              const doneNow = exportQueueRef.current.filter(
                (p) => p.imageBase64,
              ).length;
              setPrepareProgress({
                done: doneNow,
                total: exportQueueRef.current.length,
              });

              const nextMissing = exportQueueRef.current.find(
                (p) => !p.imageBase64,
              );

              if (!nextMissing) {
                setExportPages(exportQueueRef.current);
                editor.setIsConverting(true);
                setIsPreparingExport(false);
                setPreparePageNumber(null);
                return;
              }

              setPreparePageNumber(nextMissing.pageNumber);
            }}
            onError={(message) => {
              Alert.alert("שגיאת הכנה", message);
              setIsPreparingExport(false);
              editor.setIsExporting(false);
              setPreparePageNumber(null);
            }}
          />
        </View>
      )}

      {/* Multi-Page PDF Converter */}
      {editor.isConverting && exportPages.length > 0 && (
        <MultiPagePdfConverter
          pages={exportPages}
          onPdfReady={handlePdfReady}
          onError={handlePdfError}
        />
      )}

      {/* Page Selector Modal */}
      <PageSelectorModal
        visible={editor.showPageSelector}
        pages={selectorPages}
        onTogglePage={onToggleSelectorPage}
        onCancel={() => {
          editor.setShowPageSelector(false);
          editor.setIsExporting(false);
        }}
        onExport={handleMultiPageExport}
      />

      {/* Conversion Overlay */}
      {editor.isConverting && (
        <View style={styles.conversionOverlay}>
          <View style={styles.conversionBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.conversionText}>
              {isPreparingExport
                ? `מכין עמודים לייצוא... (${prepareProgress.done}/${prepareProgress.total})`
                : `ממיר ${exportPages.filter((p) => p.selected).length} עמודים ל-PDF...`}
            </Text>
          </View>
        </View>
      )}

      {isFullScreen && editor.mode === "editing" && (
        <View pointerEvents="box-none" style={styles.fullOverlay}>
          <View style={styles.fullOverlayBox}>
            <SizeControls
              disabled={editor.isExporting}
              onSigMinus={() => resizeSignature(-1)}
              onSigPlus={() => resizeSignature(1)}
              onTextMinus={() => resizeText(-1)}
              onTextPlus={() => resizeText(1)}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  fileName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },

  actions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryBtn: {
    backgroundColor: "#007AFF",
  },
  btnIcon: {
    fontSize: 20,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  pageNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageBtnIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  pageInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingHorizontal: 20,
  },
  pageText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  pageSep: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 20,
    fontWeight: "600",
  },
  pageTotalText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    fontWeight: "600",
  },
  savedIndicator: {
    color: "#34C759",
    fontSize: 18,
    marginLeft: 8,
  },

  viewer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
    position: "relative",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  emptySub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageBox: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  imageBoxImg: {
    width: "100%",
    height: "100%",
  },

  renderOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  renderBox: {
    backgroundColor: "rgba(28,28,30,0.95)",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    gap: 12,
    alignItems: "center",
  },
  renderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  conversionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  conversionBox: {
    backgroundColor: "rgba(28,28,30,0.95)",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    gap: 16,
    alignItems: "center",
  },
  conversionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },

  sizeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sizeChipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "800",
  },

  viewerFull: {
    margin: 0,
    borderRadius: 0,
  },
  fullOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  fullOverlayBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
});
