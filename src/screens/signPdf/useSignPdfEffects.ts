import { useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";
import { type PageEditState } from "./signPdfTypes";

type PdfDoc = {
  pdf?: { uri?: string | null } | null;
  isBusy: boolean;
  pickPdf: () => void;
  openPdfFromUri: (uri: string, name?: string) => void;
};

type Args = {
  doc: PdfDoc;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
  totalPages: number;
  setSelectedPages: (next: Set<number>) => void;
  setView: (next: "grid" | "editor") => void;
  setActivePage: (next: number) => void;
  setTotalPages: (next: number) => void;
  setPageEdits: (next: Record<number, PageEditState>) => void;
  setThumbnails: (next: Record<number, string>) => void;
  view: "grid" | "editor";
  isExportingPdf: boolean;
};

export function useSignPdfEffects({
  doc,
  initialFileUri,
  onFileLoaded,
  totalPages,
  setSelectedPages,
  setView,
  setActivePage,
  setTotalPages,
  setPageEdits,
  setThumbnails,
  view,
  isExportingPdf,
}: Args) {
  const autoPickedRef = useRef(false);

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
  }, [totalPages, setSelectedPages]);

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
  }, [
    doc.pdf?.uri,
    onFileLoaded,
    setView,
    setActivePage,
    setSelectedPages,
    setTotalPages,
    setPageEdits,
    setThumbnails,
  ]);

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
  }, [view, isExportingPdf, setView]);
}
