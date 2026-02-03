// src/signing/export/exportAndSharePdf.ts
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import { Image } from "react-native";
import i18n from "../../i18n";

type Args = {
  viewRef: any;
  beforeCaptureDelayMs?: number;
  dialogTitle?: string;
  pdfName?: string;
  onConversionStart?: () => void;
  onConversionProgress?: (status: string) => void;
};

/**
 * Captures view, converts to PDF using WebView component, and shares
 * This requires the ImageToPdfConverter component to be rendered
 */
export async function exportAndSharePdf({
  viewRef,
  beforeCaptureDelayMs = 60,
  dialogTitle = i18n.t("signPdf.actions.sharePdf"),
  pdfName = "signed-document.pdf",
  onConversionStart,
  onConversionProgress,
}: Args) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error(i18n.t("common.errors.sharingUnavailable"));
  }

  // Allow UI to re-render before capture
  if (beforeCaptureDelayMs > 0) {
    await new Promise((r) => setTimeout(r, beforeCaptureDelayMs));
  }

  onConversionProgress?.(i18n.t("signPdf.export.status.captureImage"));

  // Capture as PNG
  const pngUri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
  });

  onConversionProgress?.(i18n.t("signPdf.export.status.readImage"));

  // Read PNG as base64
  const pngBase64 = await FileSystem.readAsStringAsync(pngUri, {
    encoding: "base64" as any,
  });

  onConversionProgress?.(i18n.t("signPdf.export.status.computeSize"));

  // Get image dimensions
  const dimensions = await getImageDimensions(pngUri);

  onConversionStart?.();

  // Return PNG data for the WebView converter to use
  return {
    pngBase64,
    dimensions,
    pdfName,
    dialogTitle,
  };
}

/**
 * Get image dimensions
 */
function getImageDimensions(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width: number, height: number) => resolve({ width, height }),
      (error: any) => reject(error),
    );
  });
}

/**
 * Save PDF base64 to file and share it
 */
export async function savePdfAndShare(
  pdfBase64: string,
  pdfName: string,
  dialogTitle: string,
) {
  const cacheDir =
    FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
  const pdfPath = `${cacheDir}${pdfName}`;

  // Save PDF to file
  await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, {
    encoding: "base64" as any,
  });

  // Share the PDF
  await Sharing.shareAsync(pdfPath, {
    mimeType: "application/pdf",
    dialogTitle,
    UTI: "com.adobe.pdf",
  });

  return pdfPath;
}
