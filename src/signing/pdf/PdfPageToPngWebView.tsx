// src/signing/pdf/PdfPageToPngWebView.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  pdfBase64: string; // base64 WITHOUT prefix
  pageNumber: number; // 1-based
  onRendered: (
    pngDataUrl: string,
    meta: {
      width: number;
      height: number;
      pageNumber: number;
      totalPages: number;
    },
  ) => void;
  onError?: (message: string) => void;
};

type Msg =
  | { type: "ready" }
  | {
      type: "rendered";
      pngDataUrl: string;
      width: number;
      height: number;
      pageNumber: number;
      totalPages: number;
    }
  | { type: "error"; message: string };

export default function PdfPageToPngWebView({
  pdfBase64,
  pageNumber,
  onRendered,
  onError,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const html = useMemo(() => {
    const p = Math.max(1, pageNumber);

    const safeB64 = (pdfBase64 ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html,body { margin:0; padding:0; background:#111; color:#fff; height:100%; }
    .wrap { display:flex; align-items:center; justify-content:center; height:100%; }
    .meta { position:fixed; top:8px; left:8px; font:12px/1.4 sans-serif; opacity:.7; z-index:999; }
    canvas { background:#fff; max-width:100%; max-height:100%; }
  </style>
</head>
<body>
  <div class="meta" id="meta">loading…</div>
  <div class="wrap"><canvas id="c"></canvas></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  
  <script>
    (function() {
      var RN = window.ReactNativeWebView;
      var send = function(obj) { 
        if (RN) RN.postMessage(JSON.stringify(obj)); 
      };
      
      var setMeta = function(t) { 
        var el = document.getElementById("meta");
        if (el) el.textContent = t;
      };

      var pageNumber = ${p};
      var b64 = \`${safeB64}\`;

      function base64ToUint8Array(base64) {
        var raw = atob(base64);
        var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) {
          arr[i] = raw.charCodeAt(i);
        }
        return arr;
      }

      function checkPdfJs() {
        if (typeof pdfjsLib !== 'undefined') {
          run();
        } else {
          setTimeout(checkPdfJs, 100);
        }
      }

      function run() {
        send({ type: "ready" });

        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch (e) {}

        setMeta("decoding…");
        var bytes = base64ToUint8Array(b64);

        setMeta("parsing PDF…");
        var loadingTask = pdfjsLib.getDocument({ data: bytes });
        
        var pdfDocument = null;
        
        loadingTask.promise.then(function(pdf) {
          pdfDocument = pdf;
          
          if (pageNumber > pdf.numPages) {
            throw new Error("Page out of range");
          }

          setMeta("rendering page " + pageNumber + "…");
          return pdf.getPage(pageNumber);
          
        }).then(function(page) {
          var canvas = document.getElementById("c");
          var ctx = canvas.getContext("2d");
          var scale = 2;
          var viewport = page.getViewport({ scale: scale });

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          return page.render({ 
            canvasContext: ctx, 
            viewport: viewport 
          }).promise.then(function() {
            return { 
              canvas: canvas, 
              pageNumber: pageNumber, 
              totalPages: pdfDocument ? pdfDocument.numPages : 1 
            };
          });
          
        }).then(function(result) {
          setMeta("converting to PNG…");
          var pngDataUrl = result.canvas.toDataURL("image/png");

          send({ 
            type: "rendered", 
            pngDataUrl: pngDataUrl, 
            width: result.canvas.width, 
            height: result.canvas.height, 
            pageNumber: result.pageNumber,
            totalPages: result.totalPages
          });
          
          setMeta("done!");
          
        }).catch(function(err) {
          send({ 
            type: "error", 
            message: err && err.message ? err.message : String(err) 
          });
        });
      }

      setTimeout(checkPdfJs, 500);
      
    })();
  </script>
</body>
</html>`;
  }, [pdfBase64, pageNumber]);

  const onMessage = (e: any) => {
    try {
      const msg: Msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === "ready") return;

      setIsLoading(false);

      if (msg.type === "rendered") {
        onRendered(msg.pngDataUrl, {
          width: msg.width,
          height: msg.height,
          pageNumber: msg.pageNumber,
          totalPages: msg.totalPages,
        });
        return;
      }

      if (msg.type === "error") {
        onError?.(msg.message);
        return;
      }
    } catch (err: any) {
      setIsLoading(false);
      onError?.(err?.message ?? "Unknown error");
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
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        onError={(syntheticEvent) => {
          onError?.("WebView error: " + syntheticEvent.nativeEvent.description);
        }}
        style={styles.web}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>מרנדר עמוד ל־PNG…</Text>
          <Pressable style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryText}>נסה שוב</Text>
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
