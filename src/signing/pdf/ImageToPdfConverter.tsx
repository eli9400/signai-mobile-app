// src/signing/pdf/ImageToPdfConverter.tsx
import React, { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  imageBase64: string; // base64 WITHOUT data:image/png;base64, prefix
  imageWidth: number;
  imageHeight: number;
  onPdfReady: (pdfBase64: string) => void;
  onError: (error: string) => void;
};

/**
 * Hidden WebView that converts an image to PDF using jsPDF
 */
export default function ImageToPdfConverter({
  imageBase64,
  imageWidth,
  imageHeight,
  onPdfReady,
  onError,
}: Props) {
  const webRef = useRef<WebView>(null);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="status">Converting to PDF...</div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
    (function() {
      var RN = window.ReactNativeWebView;
      var send = function(obj) {
        if (RN) RN.postMessage(JSON.stringify(obj));
      };
      
      function checkJsPDF() {
        if (typeof window.jspdf !== 'undefined') {
          convertToPdf();
        } else {
          setTimeout(checkJsPDF, 100);
        }
      }
      
      function convertToPdf() {
        try {
          var statusEl = document.getElementById("status");
          statusEl.textContent = "jsPDF loaded, creating PDF...";
          
          var jsPDF = window.jspdf.jsPDF;
          var imageData = "data:image/png;base64,${imageBase64}";
          var imgWidth = ${imageWidth};
          var imgHeight = ${imageHeight};
          
          // Convert pixels to mm (1 px ≈ 0.264583 mm at 96 DPI)
          var pdfWidth = imgWidth * 0.264583;
          var pdfHeight = imgHeight * 0.264583;
          
          // Create PDF with image dimensions
          var orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
          var pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: true
          });
          
          statusEl.textContent = "Adding image to PDF...";
          
          // Add image to PDF
          pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          
          statusEl.textContent = "Generating PDF output...";
          
          // Get PDF as base64
          var pdfOutput = pdf.output('datauristring');
          var pdfBase64 = pdfOutput.split(',')[1];
          
          statusEl.textContent = "Done!";
          
          // Send to React Native
          send({
            type: 'pdf-ready',
            data: pdfBase64
          });
          
        } catch (err) {
          send({
            type: 'error',
            message: err && err.message ? err.message : String(err)
          });
        }
      }
      
      setTimeout(checkJsPDF, 500);
      
    })();
  </script>
</body>
</html>`;

  const onMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === "pdf-ready") {
        onPdfReady(msg.data);
      } else if (msg.type === "error") {
        onError(msg.message);
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
