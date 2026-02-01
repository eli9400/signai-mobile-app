// src/screens/SignPdfScreen.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { View, Platform, BackHandler, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePdfDocument } from "../signing/hooks/usePdfDocument";
import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";

import PdfPagesGrid from "../signing/pdfFlow/PdfPagesGrid";
import PdfPageEditor from "../signing/pdfFlow/PdfPageEditor";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
};

export type PageEditState = {
  pageNumber: number;
  sigPos: { x: number; y: number };
  sigSize: { w: number; h: number };
  name1: string;
  name1Pos: { x: number; y: number };
  name1Font: number;
  name2: string;
  name2Pos: { x: number; y: number };
  name2Font: number;
};

export default function SignPdfScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const doc = usePdfDocument();
  const autoPickedRef = useRef(false);

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

  const confirmExitToHome = useCallback(() => {
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

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBack = () => {
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {view === "grid" ? (
        <PdfPagesGrid
          title="דפי PDF"
          subtitle={subtitle}
          pdfReady={Boolean(pdfBase64)}
          isLoading={isLoading || shouldDiscoverTotal}
          onClose={confirmExitToHome}
          onPickPdf={doc.pickPdf}
          totalPages={totalPages}
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
    </SafeAreaView>
  );
}
