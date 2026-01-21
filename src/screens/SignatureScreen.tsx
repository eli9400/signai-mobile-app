// src/screens/SignatureScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { saveSignaturePng, clearSignature } from "../storage/signatureStore";

export default function SignatureScreen({ onDone }: { onDone: () => void }) {
  const webRef = useRef<WebView>(null);
  const [status, setStatus] = useState<string>(
    "צייר חתימה עם האצבע באזור המסומן",
  );

  const html = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <style>
    html, body { margin:0; padding:0; height:100%; background:#0f0f0f; }
    #wrap { height:100%; padding:12px; box-sizing:border-box; }

    .hint {
      color: rgba(255,255,255,0.65);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
      font-size: 14px;
      margin: 0 0 10px 2px;
    }

    .panel {
      background: #0b0b0b;
      border: 2px dashed rgba(255,255,255,0.28);
      border-radius: 16px;
      padding: 10px;
    }

    canvas {
      width: 100%;
      height: 42vh;
      background: #ffffff; /* רק לתצוגה: כדי שתראה חתימה שחורה */
      touch-action: none;
      border-radius: 12px;
      display:block;
    }

    .subhint {
      color: rgba(255,255,255,0.45);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
      font-size: 12px;
      margin: 10px 0 0 2px;
    }
  </style>
</head>
<body>
  <div id="wrap">
    <div class="hint">צייר כאן את החתימה</div>
    <div class="panel">
      <canvas id="c" width="1000" height="500"></canvas>
    </div>
    <div class="subhint">טיפ: נחתוך שוליים אוטומטית בשמירה</div>
  </div>

<script>
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');

  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'black'; // ✅ חתימה שחורה

  let drawing = false;
  let last = null;

  function pos(e){
    const r = c.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    const x = (t.clientX - r.left) * (c.width / r.width);
    const y = (t.clientY - r.top) * (c.height / r.height);
    return {x,y};
  }

  function down(e){
    if (e && e.cancelable) e.preventDefault();
    drawing = true;
    last = pos(e);
  }

  function move(e){
    if(!drawing) return;
    if (e && e.cancelable) e.preventDefault();
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  }

  function up(){
    drawing = false;
    last = null;
  }

  // Mouse
  c.addEventListener('mousedown', down);
  c.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);

  // Touch
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  window.addEventListener('touchend', up);

  function clear(){
    ctx.clearRect(0,0,c.width,c.height);
  }

  function exportPng(){
    const img = ctx.getImageData(0,0,c.width,c.height);
    const d = img.data;

    let minX=c.width, minY=c.height, maxX=0, maxY=0;
    let found=false;

    for(let y=0;y<c.height;y++){
      for(let x=0;x<c.width;x++){
        const a = d[(y*c.width + x)*4 + 3];
        if(a>0){
          found=true;
          if(x<minX) minX=x;
          if(y<minY) minY=y;
          if(x>maxX) maxX=x;
          if(y>maxY) maxY=y;
        }
      }
    }

    if(!found){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'empty'}));
      return;
    }

    const pad=20;
    minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad);
    maxX=Math.min(c.width-1,maxX+pad); maxY=Math.min(c.height-1,maxY+pad);

    const w = maxX-minX+1, h=maxY-minY+1;
    const out = document.createElement('canvas');
    out.width=w; out.height=h;
    const octx = out.getContext('2d');
    octx.putImageData(ctx.getImageData(minX,minY,w,h),0,0);

    const b64 = out.toDataURL('image/png').split(',')[1];
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'png', b64}));
  }

  window.__sig = { clear, exportPng };
</script>
</body>
</html>`;
  }, []);

  const onMessage = async (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === "empty") {
        setStatus("לא זיהיתי חתימה — צייר משהו ואז שמור");
        return;
      }

      if (msg.type === "png") {
        setStatus("שומר...");
        await saveSignaturePng(msg.b64);
        setStatus("נשמר ✅");
        onDone();
        return;
      }
    } catch {
      setStatus("שגיאה בקריאת נתונים מהקנבס");
    }
  };

  const jsClear = `window.__sig && window.__sig.clear(); true;`;
  const jsExport = `window.__sig && window.__sig.exportPng(); true;`;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>חתימה</Text>
        <Text style={styles.sub}>{status}</Text>
      </View>

      <View style={styles.canvasWrap}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          androidLayerType="software"
          onError={(e) => {
            setStatus(
              "WebView error: " + (e?.nativeEvent?.description ?? "unknown"),
            );
          }}
          onHttpError={(e) => {
            setStatus(
              "WebView HTTP error: " +
                (e?.nativeEvent?.statusCode ?? "unknown"),
            );
          }}
          onContentProcessDidTerminate={() => {
            setStatus("WebView process terminated (iOS)");
          }}
          style={styles.web}
        />
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.btn}
          onPress={() => webRef.current?.injectJavaScript(jsClear)}
        >
          <Text style={styles.btnText}>נקה</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => webRef.current?.injectJavaScript(jsExport)}
        >
          <Text style={styles.btnText}>שמור</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.btn, styles.deleteBtn]}
        onPress={async () => {
          await clearSignature();
          onDone();
        }}
      >
        <Text style={styles.btnText}>מחק חתימה שמורה</Text>
      </Pressable>

      <Pressable style={styles.link} onPress={onDone}>
        <Text style={styles.linkText}>חזרה</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b", padding: 16 },
  header: { gap: 6, marginBottom: 12 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "white", opacity: 0.7 },

  canvasWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  web: { backgroundColor: "#0f0f0f" },

  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteBtn: { marginTop: 10, backgroundColor: "#1b1b1b" },
  btnText: { color: "white", fontWeight: "700" },

  link: { marginTop: 12, alignItems: "center", paddingVertical: 10 },
  linkText: { color: "white", opacity: 0.7 },
});
