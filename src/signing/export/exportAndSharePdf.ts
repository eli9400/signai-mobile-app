// src/signing/export/exportAndSharePdf.ts
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import { PDFDocument } from "pdf-lib";
import i18n from "../../i18n";

type Args = {
  viewRef: any;
  beforeCaptureDelayMs?: number;
  dialogTitle?: string;
  pdfName?: string;
  jpegQuality?: number;
  onConversionStart?: () => void;
  onConversionProgress?: (status: string) => void;
};

export async function exportAndSharePdf({
  viewRef,
  beforeCaptureDelayMs = 60,
  dialogTitle = i18n.t("signPdf.actions.sharePdf"),
  pdfName = "signed-document.pdf",
  jpegQuality = 0.88,
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

  const imageBase64 = await captureRef(viewRef, {
    format: "jpg",
    quality: jpegQuality,
    result: "base64",
  });

  onConversionProgress?.(i18n.t("signPdf.export.status.computeSize"));
  onConversionStart?.();

  const pdfBase64 = await createSingleImagePdfBase64(imageBase64);
  return savePdfAndShare(pdfBase64, pdfName, dialogTitle);
}

export async function createSingleImagePdfBase64(imageBase64: string) {
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(base64ToUint8(imageBase64));
  const page = pdfDoc.addPage([image.width, image.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return uint8ToBase64(await pdfDoc.save());
}

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

function base64ToUint8(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function uint8ToBase64(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return globalThis.btoa(binary);
}
