import { useCallback, useState, type ElementRef, type RefObject } from "react";
import type { View } from "react-native";
import { exportAndSharePng } from "../../export/exportAndSharePng";

type ViewRef = ElementRef<typeof View>;

type Args = {
  canShowImage: boolean;
  imageBoxRef: RefObject<ViewRef | null>;
  shareTitle: string;
};

export function useImageExport({ canShowImage, imageBoxRef, shareTitle }: Args) {
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
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  }, [canShowImage, imageBoxRef, shareTitle]);

  return { isExporting, exportImage, setIsExporting };
}
