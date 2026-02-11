import { useCallback, useState, type ElementRef, type RefObject } from "react";
import type { View } from "react-native";
import { exportAndSharePng } from "../../export/exportAndSharePng";

type ViewRef = ElementRef<typeof View>;

type Args = {
  canShowImage: boolean;
  imageBoxRef: RefObject<ViewRef | null>;
  shareTitle: string;
  onExportComplete?: () => void;
};

export function useImageExport({
  canShowImage,
  imageBoxRef,
  shareTitle,
  onExportComplete,
}: Args) {
  const [isExporting, setIsExporting] = useState(false);

  const exportImage = useCallback(async () => {
    if (!canShowImage) return;

    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!imageBoxRef.current) {
        setIsExporting(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      await exportAndSharePng({
        viewRef: imageBoxRef,
        beforeCaptureDelayMs: 100,
        dialogTitle: shareTitle,
      });

      // Call onExportComplete after successful export
      onExportComplete?.();
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  }, [canShowImage, imageBoxRef, shareTitle, onExportComplete]);

  return { isExporting, exportImage, setIsExporting };
}
