// src/signing/editor/SignOverlayEditor.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { clamp, dist } from "../geometry";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type ActiveTarget = "sig" | "name1" | "name2" | null;

type Props = {
  imageUri: string | null;
  signatureUri: string | null;
  title?: string;
  onBack?: () => void;
};

export default function SignOverlayEditor({
  imageUri,
  signatureUri,
  title = "חתימה + שמות",
  onBack,
}: Props) {
  const stageRef = useRef<View>(null);
  const imageBoxRef = useRef<View>(null);

  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);
  const [imgPx, setImgPx] = useState<{ w: number; h: number } | null>(null);

  const [sigSize, setSigSize] = useState({ w: 180, h: 90 });
  const [sigPos, setSigPos] = useState<Point>({ x: 20, y: 20 });

  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [name1Pos, setName1Pos] = useState<Point>({ x: 20, y: 140 });
  const [name2Pos, setName2Pos] = useState<Point>({ x: 20, y: 190 });
  const [name1Font, setName1Font] = useState(22);
  const [name2Font, setName2Font] = useState(22);

  const [active, setActive] = useState<ActiveTarget>(null);

  const [drag, setDrag] = useState({
    isDragging: false,
    startTouch: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    target: null as ActiveTarget,
  });

  const [pinch, setPinch] = useState({
    isPinching: false,
    startDist: 0,
    startSigSize: { w: 0, h: 0 },
    startPos: { x: 0, y: 0 },
    startFont: 0,
    target: null as ActiveTarget,
  });

  const [isExporting, setIsExporting] = useState(false);

  const minSigW = 90;
  const maxSigW = Math.max(160, Math.round(containerW * 0.85));
  const minFont = 12;
  const maxFont = 54;

  useEffect(() => {
    if (!imageUri) return;
    Image.getSize(
      imageUri,
      (w, h) => setImgPx({ w, h }),
      () => setImgPx(null),
    );
  }, [imageUri]);

  const imageBox: Rect | null = useMemo(() => {
    if (!imgPx || containerW <= 0 || containerH <= 0) return null;
    const scale = Math.min(containerW / imgPx.w, containerH / imgPx.h);
    const w = imgPx.w * scale;
    const h = imgPx.h * scale;
    return { x: (containerW - w) / 2, y: (containerH - h) / 2, w, h };
  }, [imgPx, containerW, containerH]);

  useEffect(() => {
    if (!imageBox) return;
    setSigPos((p) => ({
      x: clamp(p.x, 0, Math.max(0, imageBox.w - sigSize.w)),
      y: clamp(p.y, 0, Math.max(0, imageBox.h - sigSize.h)),
    }));
    const maxX = Math.max(0, imageBox.w - 40);
    const maxY = Math.max(0, imageBox.h - 40);
    setName1Pos((p) => ({ x: clamp(p.x, 0, maxX), y: clamp(p.y, 0, maxY) }));
    setName2Pos((p) => ({ x: clamp(p.x, 0, maxX), y: clamp(p.y, 0, maxY) }));
  }, [imageBox, sigSize.w, sigSize.h]);

  const getPos = (t: ActiveTarget): Point =>
    t === "sig"
      ? sigPos
      : t === "name1"
        ? name1Pos
        : t === "name2"
          ? name2Pos
          : { x: 0, y: 0 };

  const setPos = (t: ActiveTarget, p: Point) => {
    if (t === "sig") setSigPos(p);
    else if (t === "name1") setName1Pos(p);
    else if (t === "name2") setName2Pos(p);
  };

  const getFont = (t: ActiveTarget) =>
    t === "name1" ? name1Font : t === "name2" ? name2Font : 0;
  const setFont = (t: ActiveTarget, v: number) => {
    if (t === "name1") setName1Font(v);
    else if (t === "name2") setName2Font(v);
  };

  const onGrant = (target: ActiveTarget) => (evt: any) => {
    if (isExporting) return;
    Keyboard.dismiss();
    setActive(target);

    const touches = evt.nativeEvent.touches ?? [];
    if (touches.length >= 2) {
      const d0 = dist(touches[0], touches[1]);
      setPinch({
        isPinching: true,
        startDist: d0,
        startSigSize: { ...sigSize },
        startPos: getPos(target),
        startFont: getFont(target),
        target,
      });
      setDrag((d) => ({ ...d, isDragging: false, target: null }));
      return;
    }

    const { pageX, pageY } = evt.nativeEvent;
    setDrag({
      isDragging: true,
      startTouch: { x: pageX, y: pageY },
      startPos: getPos(target),
      target,
    });
    setPinch((p) => ({ ...p, isPinching: false, target: null }));
  };

  const onMove = (evt: any) => {
    if (isExporting || !imageBox) return;
    const touches = evt.nativeEvent.touches ?? [];

    if (touches.length >= 2) {
      const target = pinch.target ?? drag.target ?? active;
      if (!target) return;

      if (!pinch.isPinching) {
        setPinch({
          isPinching: true,
          startDist: dist(touches[0], touches[1]),
          startSigSize: { ...sigSize },
          startPos: getPos(target),
          startFont: getFont(target),
          target,
        });
        setDrag((d) => ({ ...d, isDragging: false, target: null }));
        return;
      }

      const scale =
        pinch.startDist > 0
          ? dist(touches[0], touches[1]) / pinch.startDist
          : 1;

      if (pinch.target === "sig") {
        let nextW = clamp(pinch.startSigSize.w * scale, minSigW, maxSigW);
        const ratio =
          pinch.startSigSize.w > 0
            ? pinch.startSigSize.h / pinch.startSigSize.w
            : 0.5;
        const nextH = nextW * ratio;

        setSigSize({ w: nextW, h: nextH });
        setSigPos({
          x: clamp(pinch.startPos.x, 0, Math.max(0, imageBox.w - nextW)),
          y: clamp(pinch.startPos.y, 0, Math.max(0, imageBox.h - nextH)),
        });
        return;
      }

      if (pinch.target === "name1" || pinch.target === "name2") {
        setFont(pinch.target, clamp(pinch.startFont * scale, minFont, maxFont));
        return;
      }

      return;
    }

    if (!drag.isDragging || !drag.target) return;
    const { pageX, pageY } = evt.nativeEvent;
    const dx = pageX - drag.startTouch.x;
    const dy = pageY - drag.startTouch.y;

    const nextX = drag.startPos.x + dx;
    const nextY = drag.startPos.y + dy;

    if (drag.target === "sig") {
      setSigPos({
        x: clamp(nextX, 0, Math.max(0, imageBox.w - sigSize.w)),
        y: clamp(nextY, 0, Math.max(0, imageBox.h - sigSize.h)),
      });
      return;
    }

    setPos(drag.target, {
      x: clamp(nextX, 0, Math.max(0, imageBox.w - 40)),
      y: clamp(nextY, 0, Math.max(0, imageBox.h - 40)),
    });
  };

  const onEnd = () => {
    setDrag((d) => ({ ...d, isDragging: false, target: null }));
    setPinch((p) => ({ ...p, isPinching: false, target: null }));
    setActive(null);
  };

  const canExport = Boolean(imageUri && imageBox);

  const exportAndShare = async () => {
    if (!canExport) return Alert.alert("אין תמונה", "אין תמונה מוכנה לייצוא.");
    if (!(await Sharing.isAvailableAsync()))
      return Alert.alert("שיתוף לא זמין", "אין שיתוף במכשיר הזה.");

    try {
      Keyboard.dismiss();
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 60));

      const uri = await captureRef(imageBoxRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "שתף תמונה חתומה",
        UTI: "public.png",
      });
    } catch (e: any) {
      Alert.alert("שגיאה", e?.message ?? "לא הצלחתי לייצא");
    } finally {
      setIsExporting(false);
    }
  };

  const isInteracting = (t: ActiveTarget) =>
    (drag.isDragging && drag.target === t) ||
    (pinch.isPinching && pinch.target === t);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          אצבע אחת = הזזה | שתי אצבעות = שינוי גודל
        </Text>
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם1</Text>
          <TextInput
            value={name1}
            onChangeText={setName1}
            style={styles.input}
            editable={!isExporting}
          />
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם2</Text>
          <TextInput
            value={name2}
            onChangeText={setName2}
            style={styles.input}
            editable={!isExporting}
          />
        </View>
      </View>

      <View
        ref={stageRef}
        collapsable={false}
        style={styles.stage}
        onLayout={(e) => {
          setContainerW(e.nativeEvent.layout.width);
          setContainerH(e.nativeEvent.layout.height);
        }}
      >
        {!imageUri ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>אין תמונה עדיין</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
            {imageBox && (
              <View
                ref={imageBoxRef}
                collapsable={false}
                style={[
                  styles.imageBox,
                  {
                    left: imageBox.x,
                    top: imageBox.y,
                    width: imageBox.w,
                    height: imageBox.h,
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imageBoxImg}
                  resizeMode="cover"
                />

                {!!signatureUri && (
                  <View
                    style={[
                      styles.box,
                      {
                        width: sigSize.w,
                        height: sigSize.h,
                        left: sigPos.x,
                        top: sigPos.y,
                        borderWidth: isExporting ? 0 : 1,
                        borderColor: isInteracting("sig")
                          ? "rgba(0,0,0,0.65)"
                          : "rgba(0,0,0,0.25)",
                        backgroundColor: isExporting
                          ? "transparent"
                          : "rgba(255,255,255,0.85)",
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={onGrant("sig")}
                    onResponderMove={onMove}
                    onResponderRelease={onEnd}
                    onResponderTerminate={onEnd}
                  >
                    <Image
                      source={{ uri: signatureUri }}
                      style={styles.sigImg}
                      resizeMode="contain"
                    />
                    {!isExporting && isInteracting("sig") && (
                      <View style={styles.hint}>
                        <Text style={styles.hintText}>
                          {pinch.isPinching ? "שנה גודל" : "גרור / צבט"}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {name1.trim() ? (
                  <View
                    style={[
                      styles.textBox,
                      {
                        left: name1Pos.x,
                        top: name1Pos.y,
                        borderWidth: isExporting ? 0 : 1,
                        borderColor: isInteracting("name1")
                          ? "rgba(0,0,0,0.65)"
                          : "rgba(0,0,0,0.25)",
                        backgroundColor: isExporting
                          ? "transparent"
                          : "rgba(255,255,255,0.85)",
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={onGrant("name1")}
                    onResponderMove={onMove}
                    onResponderRelease={onEnd}
                    onResponderTerminate={onEnd}
                  >
                    <Text style={[styles.text, { fontSize: name1Font }]}>
                      {name1}
                    </Text>
                    {!isExporting && isInteracting("name1") && (
                      <View style={styles.hint}>
                        <Text style={styles.hintText}>
                          {pinch.isPinching ? "שנה גודל" : "גרור / צבט"}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {name2.trim() ? (
                  <View
                    style={[
                      styles.textBox,
                      {
                        left: name2Pos.x,
                        top: name2Pos.y,
                        borderWidth: isExporting ? 0 : 1,
                        borderColor: isInteracting("name2")
                          ? "rgba(0,0,0,0.65)"
                          : "rgba(0,0,0,0.25)",
                        backgroundColor: isExporting
                          ? "transparent"
                          : "rgba(255,255,255,0.85)",
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={onGrant("name2")}
                    onResponderMove={onMove}
                    onResponderRelease={onEnd}
                    onResponderTerminate={onEnd}
                  >
                    <Text style={[styles.text, { fontSize: name2Font }]}>
                      {name2}
                    </Text>
                    {!isExporting && isInteracting("name2") && (
                      <View style={styles.hint}>
                        <Text style={styles.hintText}>
                          {pinch.isPinching ? "שנה גודל" : "גרור / צבט"}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, !canExport && styles.btnDisabled]}
          disabled={!canExport || isExporting}
          onPress={exportAndShare}
        >
          {isExporting ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={styles.btnText}>מייצא…</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>ייצא ושתף</Text>
          )}
        </Pressable>

        {!!onBack && (
          <Pressable
            style={[styles.btn, styles.backBtn]}
            onPress={onBack}
            disabled={isExporting}
          >
            <Text style={styles.btnText}>חזרה</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0b", padding: 16, gap: 12 },
  header: { gap: 6 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "white", opacity: 0.7, lineHeight: 18 },

  inputsRow: { flexDirection: "row", gap: 10 },
  inputWrap: { flex: 1, gap: 6 },
  inputLabel: { color: "white", opacity: 0.75, fontSize: 12 },
  input: {
    backgroundColor: "#161616",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  stage: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: "white", opacity: 0.8, fontWeight: "700" },

  image: { width: "100%", height: "100%" },

  imageBox: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  imageBoxImg: { width: "100%", height: "100%" },

  box: { position: "absolute", borderRadius: 12, overflow: "hidden" },
  sigImg: { width: "100%", height: "100%" },

  textBox: {
    position: "absolute",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  text: { color: "#000", fontWeight: "600" },

  hint: {
    position: "absolute",
    right: 8,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  hintText: { color: "white", fontSize: 12, opacity: 0.9 },

  actions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  backBtn: { backgroundColor: "#1b1b1b" },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "white", fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
});
