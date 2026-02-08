import type { Quality } from "./pdfPageToPngTypes";

type Args = {
  pdfBase64: string;
  pageNumber: number;
  quality: Quality;
};

export function buildPdfPageToPngHtml({
  pdfBase64,
  pageNumber,
  quality,
}: Args) {
  const p = Math.max(1, pageNumber);

  // high for editing, thumb for grid
  const scale = quality === "thumb" ? 1.0 : 2.0;

  // thumbnails: cap output size to save time + memory
  const maxThumbW = 520;
  const maxThumbH = 720;

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
      var send = function(obj) { if (RN) RN.postMessage(JSON.stringify(obj)); };
      var setMeta = function(t) { var el = document.getElementById("meta"); if (el) el.textContent = t; };

      var pageNumber = ${p};
      var b64 = \`${safeB64}\`;
      var quality = "${quality}";
      var scale = ${scale};
      var maxThumbW = ${maxThumbW};
      var maxThumbH = ${maxThumbH};

      function base64ToUint8Array(base64) {
        var raw = atob(base64);
        var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
      }

      function checkPdfJs() {
        if (typeof pdfjsLib !== 'undefined') run();
        else setTimeout(checkPdfJs, 80);
      }

      function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

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
          if (pageNumber > pdf.numPages) throw new Error("Page out of range");
          setMeta("rendering page " + pageNumber + "…");
          return pdf.getPage(pageNumber);
        }).then(function(page) {
          var canvas = document.getElementById("c");
          var ctx = canvas.getContext("2d", { alpha: false });
          var viewport = page.getViewport({ scale: scale });

          if (quality === "thumb") {
            var w = viewport.width;
            var h = viewport.height;
            var fitScaleW = maxThumbW / w;
            var fitScaleH = maxThumbH / h;
            var fitScale = Math.min(1, fitScaleW, fitScaleH);
            fitScale = clamp(fitScale, 0.5, 1);
            if (fitScale < 1) viewport = page.getViewport({ scale: scale * fitScale });
          }

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
            return { canvas: canvas, pageNumber: pageNumber, totalPages: pdfDocument ? pdfDocument.numPages : 1 };
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
            totalPages: result.totalPages,
            quality: quality
          });
          setMeta("done!");
        }).catch(function(err) {
          send({ type: "error", message: err && err.message ? err.message : String(err) });
        });
      }

      setTimeout(checkPdfJs, 250);
    })();
  </script>
</body>
</html>`;
}
