import { useCallback, useState, type ElementRef, type RefObject } from "react";
import { Alert, type View } from "react-native";
import { exportAndSharePdf } from "../../export/exportAndSharePdf";
import { exportAndSharePng } from "../../export/exportAndSharePng";

type ViewRef = ElementRef<typeof View>;
type ExportKind = "png" | "pdf";

type Args = {
  canShowImage: boolean;
  imageBoxRef: RefObject<ViewRef | null>;
  pngShareTitle: string;
  pdfShareTitle: string;
  chooseTitle: string;
  exportPngLabel: string;
  exportPdfLabel: string;
  cancelLabel: string;
  onExportComplete?: () => void | Promise<void>;
};

export function useImageExport({
  canShowImage,
  imageBoxRef,
  pngShareTitle,
  pdfShareTitle,
  chooseTitle,
  exportPngLabel,
  exportPdfLabel,
  cancelLabel,
  onExportComplete,
}: Args) {
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);
  const isExporting = exportKind !== null;

  const runExport = useCallback(async (kind: ExportKind) => {
    if (!canShowImage) return;

    try {
      setExportKind(kind);
      await new Promise((resolve) => setTimeout(resolve, 120));

      if (!imageBoxRef.current) {
        return;
      }

      if (kind === "pdf") {
        await exportAndSharePdf({
          viewRef: imageBoxRef,
          beforeCaptureDelayMs: 0,
          dialogTitle: pdfShareTitle,
          pdfName: "signed-image.pdf",
        });
      } else {
        await exportAndSharePng({
          viewRef: imageBoxRef,
          beforeCaptureDelayMs: 40,
          dialogTitle: pngShareTitle,
        });
      }

      await onExportComplete?.();
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setExportKind(null);
    }
  }, [
    canShowImage,
    imageBoxRef,
    pngShareTitle,
    pdfShareTitle,
    onExportComplete,
  ]);

  const exportPng = useCallback(() => runExport("png"), [runExport]);
  const exportPdf = useCallback(() => runExport("pdf"), [runExport]);

  const exportImage = useCallback(() => {
    if (!canShowImage || isExporting) return;

    Alert.alert(chooseTitle, undefined, [
      { text: exportPdfLabel, onPress: exportPdf },
      { text: exportPngLabel, onPress: exportPng },
      { text: cancelLabel, style: "cancel" },
    ]);
  }, [
    canShowImage,
    isExporting,
    chooseTitle,
    exportPdfLabel,
    exportPngLabel,
    cancelLabel,
    exportPdf,
    exportPng,
  ]);

  return { isExporting, exportKind, exportImage, exportPng, exportPdf };
}
