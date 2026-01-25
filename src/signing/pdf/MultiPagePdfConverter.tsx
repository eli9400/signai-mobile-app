// src/signing/pdf/MultiPagePdfConverter.tsx
import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { getMultiPagePdfHtml } from "../export/exportMultiPagePdf";

type PageData = {
  pageNumber: number;
  imageBase64: string;
  width: number;
  height: number;
  selected: boolean;
};

type Props = {
  pages: PageData[];
  onPdfReady: (pdfBase64: string) => void;
  onError: (error: string) => void;
  onProgress?: (current: number, total: number) => void;
};

/**
 * Hidden WebView that converts multiple pages to a single PDF using jsPDF
 */
export default function MultiPagePdfConverter({
  pages,
  onPdfReady,
  onError,
  onProgress,
}: Props) {
  const webRef = useRef<WebView>(null);

  const selectedPages = pages.filter((p) => p.selected);
  const html = getMultiPagePdfHtml(selectedPages);

  const onMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === "pdf-ready") {
        onPdfReady(msg.data);
      } else if (msg.type === "error") {
        onError(msg.message);
      } else if (msg.type === "progress" && onProgress) {
        onProgress(msg.current, msg.total);
      }
    } catch (err: any) {
      onError(err?.message ?? "Unknown error");
    }
  };

  return (
    <View style={styles.hidden}>
      <WebView
        ref={webRef}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onError={(e) => onError(e.nativeEvent.description || "WebView error")}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
  },
  webview: {
    width: 1,
    height: 1,
  },
});
