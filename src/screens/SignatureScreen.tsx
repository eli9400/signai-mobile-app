// src/screens/SignatureScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { saveSignaturePng, clearSignature } from "../storage/signatureStore";
import { theme } from "../ui/theme";

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
   html, body { margin:0; padding:0; height:100%; background:#F3F6FF; }
#wrap { height:100%; padding:12px; box-sizing:border-box; }

.hint {
  color: rgba(15,23,42,0.85);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
  font-size: 14px;
  font-weight: 800;
  margin: 0 0 10px 2px;
}

.panel {
  background: #FFFFFF;
  border: 2px dashed rgba(37,99,235,0.25);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 10px 24px rgba(15,23,42,0.10);
}

canvas {
  width: 100%;
  height: 200px;
  background: #ffffff;
  touch-action: none;
  border-radius: 12px;
  display:block;
}

.subhint {
  color: rgba(15,23,42,0.55);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
  font-size: 12px;
  font-weight: 600;
  margin: 10px 0 0 2px;
  text-align: center;
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
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>חתימה</Text>

          <Pressable style={styles.closeBtn} onPress={onDone}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Hero / hint */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>צור חתימה</Text>
          <Text style={styles.heroSub}>{status}</Text>
        </View>

        {/* Canvas card */}
        <View style={styles.card}>
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
                  "WebView error: " +
                    (e?.nativeEvent?.description ?? "unknown"),
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

          {/* Buttons row */}
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => webRef.current?.injectJavaScript(jsClear)}
            >
              <Text style={styles.btnSecondaryText}>נקה</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => webRef.current?.injectJavaScript(jsExport)}
            >
              <Text style={styles.btnPrimaryText}>שמור</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={async () => {
              await clearSignature();
              onDone();
            }}
          >
            <Text style={styles.btnDangerText}>מחק חתימה שמורה</Text>
          </Pressable>
        </View>

        <View style={styles.spacerBottom} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.pagePadding,
    paddingTop: 6,
    gap: 14,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  appTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 18,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  closeBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  // Hero
  hero: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.10)",
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },

  // Card
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 14,
    gap: 12,
    ...theme.shadow.card,
  },

  // Canvas area
  canvasWrap: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F6FF", // ✅ תואם לרקע הבהיר של ה-HTML
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  web: { flex: 1, backgroundColor: "#F3F6FF" },

  // Buttons
  row: { flexDirection: "row", gap: 10 },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },

  btnSecondary: {
    flex: 1,
    backgroundColor: theme.colors.buttonSecondaryBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  btnSecondaryText: {
    color: theme.colors.buttonSecondaryText,
    fontWeight: "900",
  },

  btnPrimary: {
    flex: 1,
    backgroundColor: theme.colors.brand,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "900",
  },

  btnDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  btnDangerText: {
    color: "rgba(239, 68, 68, 1)",
    fontWeight: "900",
  },

  spacerBottom: { flex: 1 },
});
