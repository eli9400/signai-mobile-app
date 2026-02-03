// src/signing/export/exportAndSharePng.ts
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import i18n from "../../i18n";

type Args = {
  viewRef: any; // ref to a View (collapsable={false})
  beforeCaptureDelayMs?: number;
  dialogTitle?: string;
};

export async function exportAndSharePng({
  viewRef,
  beforeCaptureDelayMs = 60,
  dialogTitle = i18n.t("imageEditor.export.shareTitle"),
}: Args) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error(i18n.t("common.errors.sharingUnavailable"));
  }

  // allow UI to re-render (hide borders/hints) before capture
  if (beforeCaptureDelayMs > 0) {
    await new Promise((r) => setTimeout(r, beforeCaptureDelayMs));
  }

  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
  });

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle,
    UTI: "public.png",
  });

  return uri;
}
