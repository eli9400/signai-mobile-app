// src/signing/pdf/PdfPageToPngWebView.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { buildPdfPageToPngHtml } from "./pdfPageToPngHtml";
import type {
  PdfPageRenderMeta,
  PdfPageToPngMessage,
  Quality,
} from "./pdfPageToPngTypes";

type Props = {
  pdfBase64: string; // base64 WITHOUT prefix
  pageNumber: number; // 1-based

  /**
   * Render quality
   * - "high": edit view (default)
   * - "thumb": preview grid (faster)
   */
  quality?: Quality;

  onRendered: (pngDataUrl: string, meta: PdfPageRenderMeta) => void;
  onError?: (message: string) => void;
};

export default function PdfPageToPngWebView({
  pdfBase64,
  pageNumber,
  quality = "high",
  onRendered,
  onError,
}: Props) {
  const { t } = useTranslation();
  const webRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const html = useMemo(
    () => buildPdfPageToPngHtml({ pdfBase64, pageNumber, quality }),
    [pdfBase64, pageNumber, quality],
  );

  const onMessage = (e: any) => {
    try {
      const msg: PdfPageToPngMessage = JSON.parse(e.nativeEvent.data);

      if (msg.type === "ready") return;
      setIsLoading(false);

      if (msg.type === "rendered") {
        onRendered(msg.pngDataUrl, {
          width: msg.width,
          height: msg.height,
          pageNumber: msg.pageNumber,
          totalPages: msg.totalPages,
          quality: msg.quality,
        });
        return;
      }

      if (msg.type === "error") {
        onError?.(msg.message);
        return;
      }
    } catch (err: any) {
      setIsLoading(false);
      onError?.(err?.message ?? t("common.errors.unknown"));
    }
  };

  const retry = () => {
    setIsLoading(true);
    webRef.current?.reload();
  };

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onError={(syntheticEvent) => {
          onError?.(
            t("common.errors.webviewError", {
              message: syntheticEvent.nativeEvent.description,
            }),
          );
        }}
        style={styles.web}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>
            {quality === "thumb"
              ? t("signPdf.pageRenderer.thumbLoading")
              : t("signPdf.pageRenderer.pageRendering")}
          </Text>
          <Pressable style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryText}>{t("signPdf.pageRenderer.retry")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 16, overflow: "hidden" },
  web: { flex: 1, backgroundColor: "#111" },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  loadingText: { color: "white", fontWeight: "700" },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  retryText: { color: "white", fontWeight: "700" },
});
