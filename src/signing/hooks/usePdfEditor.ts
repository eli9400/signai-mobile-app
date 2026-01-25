// src/signing/hooks/usePdfEditor.ts
import { useState, useRef, useMemo, useCallback } from "react";
import { Alert, Dimensions } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import { clamp, type Point } from "../geometry";

export type EditedPage = {
  pageNumber: number;
  imageBase64: string;
  width: number;
  height: number;
  selected: boolean;
  hasSignature: boolean;
  hasText: boolean;
};

type Mode = "idle" | "rendering" | "editing";

export function usePdfEditor(signatureUri: string | null) {
  const imageBoxRef = useRef<any>(null);

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const [isPicking, setIsPicking] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [pngMeta, setPngMeta] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [name1Pos, setName1Pos] = useState<Point>({ x: 20, y: 140 });
  const [name2Pos, setName2Pos] = useState<Point>({ x: 20, y: 190 });
  const [name1Font, setName1Font] = useState(22);
  const [name2Font, setName2Font] = useState(22);

  const [sigSize, setSigSize] = useState({ w: 180, h: 90 });
  const [sigPos, setSigPos] = useState<Point>({ x: 20, y: 20 });

  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const [editedPages, setEditedPages] = useState<EditedPage[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);

  const { width: screenW } = Dimensions.get("window");
  const canSign = Boolean(signatureUri);

  const readPdfAsBase64 = async (uri: string) => {
    setIsReading(true);
    try {
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as any,
      });
      return b64;
    } finally {
      setIsReading(false);
    }
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

      setPdfUri(asset.uri);
      setPdfName(asset.name ?? "document.pdf");

      // Reset state
      setPageNumber(1);
      setTotalPages(null);
      setMode("idle");
      setPngDataUrl(null);
      setPngMeta(null);
      setPdfBase64(null);
      setEditedPages([]);

      // Reset editing state
      setName1("");
      setName2("");
      setSigPos({ x: 20, y: 20 });
      setName1Pos({ x: 20, y: 140 });
      setName2Pos({ x: 20, y: 190 });

      const w = clamp(Math.round(screenW * 0.38), 140, 240);
      setSigSize({ w, h: Math.round(w * 0.5) });

      // Load and render
      const b64 = await readPdfAsBase64(asset.uri);
      setPdfBase64(b64);
      setMode("rendering");
    } catch (e: any) {
      Alert.alert("שגיאה", e?.message ?? "לא הצלחתי לבחור/לטעון PDF");
    } finally {
      setIsPicking(false);
    }
  };

  const saveCurrentPage = useCallback(async () => {
    if (!pngMeta || !imageBoxRef.current) return null;

    try {
      // Capture current page
      const pngUri = await captureRef(imageBoxRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      // Read as base64
      const pngBase64 = await FileSystem.readAsStringAsync(pngUri, {
        encoding: "base64" as any,
      });

      return {
        pageNumber,
        imageBase64: pngBase64,
        width: pngMeta.width,
        height: pngMeta.height,
        selected: true,
        hasSignature: Boolean(signatureUri && canSign),
        hasText: Boolean(name1 || name2),
      };
    } catch (e) {
      console.error("Error saving page:", e);
      return null;
    }
  }, [pageNumber, pngMeta, signatureUri, canSign, name1, name2]);

  const goToPage = useCallback(
    async (newPageNumber: number) => {
      if (newPageNumber < 1 || (totalPages && newPageNumber > totalPages)) {
        return;
      }

      // Save current page before navigating
      if (mode === "editing") {
        const savedPage = await saveCurrentPage();
        if (savedPage) {
          setEditedPages((prev) => {
            const existing = prev.findIndex((p) => p.pageNumber === pageNumber);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = savedPage;
              return updated;
            }
            return [...prev, savedPage].sort(
              (a, b) => a.pageNumber - b.pageNumber,
            );
          });
        }
      }

      setPageNumber(newPageNumber);
      setMode("rendering");
      setPngDataUrl(null);
      setPngMeta(null);

      // Check if we have this page saved
      const savedPage = editedPages.find((p) => p.pageNumber === newPageNumber);
      if (savedPage) {
        // Restore saved state
        // Note: This is simplified - you might want to restore signature/text positions too
      }
    },
    [mode, pageNumber, totalPages, saveCurrentPage, editedPages],
  );

  const prevPage = () => goToPage(pageNumber - 1);
  const nextPage = () => goToPage(pageNumber + 1);

  const onStageLayout = (e: any) => {
    setContainerW(e.nativeEvent.layout.width);
    setContainerH(e.nativeEvent.layout.height);
  };

  const togglePageSelection = (pageNum: number) => {
    setEditedPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNum ? { ...p, selected: !p.selected } : p,
      ),
    );
  };

  const canExport = mode === "editing" && pngMeta && pngDataUrl;

  const fileLabel = useMemo(() => {
    if (!pdfName) return null;
    const pageInfo = totalPages
      ? ` | עמוד ${pageNumber} מתוך ${totalPages}`
      : ` | עמוד ${pageNumber}`;
    return `${pdfName}${pageInfo}`;
  }, [pdfName, pageNumber, totalPages]);

  return {
    // Refs
    imageBoxRef,

    // PDF State
    pdfUri,
    pdfName,
    pdfBase64,
    isPicking,
    isReading,

    // Page State
    pageNumber,
    totalPages,
    mode,
    pngDataUrl,
    pngMeta,

    // Layout
    containerW,
    containerH,

    // Editing State
    name1,
    setName1,
    name2,
    setName2,
    name1Pos,
    setName1Pos,
    name2Pos,
    setName2Pos,
    name1Font,
    setName1Font,
    name2Font,
    setName2Font,
    sigSize,
    setSigSize,
    sigPos,
    setSigPos,

    // Export State
    isExporting,
    setIsExporting,
    isConverting,
    setIsConverting,

    // Multi-page State
    editedPages,
    setEditedPages,
    showPageSelector,
    setShowPageSelector,

    // Computed
    canSign,
    canExport,
    fileLabel,

    // Actions
    pickPdf,
    prevPage,
    nextPage,
    goToPage,
    onStageLayout,
    saveCurrentPage,
    togglePageSelection,

    // Setters for rendering
    setMode,
    setPngDataUrl,
    setPngMeta,
    setTotalPages,
    setPageNumber,
  };
}
