// src/screens/SignImageScreen.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
};

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function dist(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number },
) {
  const dx = a.pageX - b.pageX;
  const dy = a.pageY - b.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

type ActiveTarget = "sig" | "name1" | "name2" | null;

export default function SignImageScreen({ signatureUri, onBack }: Props) {
  const stageRef = useRef<View>(null);
  const imageBoxRef = useRef<View>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);

  // stage size (full black/gray area on screen)
  const [containerW, setContainerW] = useState<number>(0);
  const [containerH, setContainerH] = useState<number>(0);

  // actual image pixel size (original)
  const [imgPx, setImgPx] = useState<{ w: number; h: number } | null>(null);

  // ===== Signature overlay (coords are INSIDE imageBox) =====
  const [sigSize, setSigSize] = useState<{ w: number; h: number }>({
    w: 180,
    h: 90,
  });
  const [sigPos, setSigPos] = useState<Point>({ x: 20, y: 20 });

  // ===== Text overlays (coords are INSIDE imageBox) =====
  const [name1, setName1] = useState<string>("");
  const [name2, setName2] = useState<string>("");

  const [name1Pos, setName1Pos] = useState<Point>({ x: 20, y: 140 });
  const [name2Pos, setName2Pos] = useState<Point>({ x: 20, y: 190 });

  const [name1Font, setName1Font] = useState<number>(22);
  const [name2Font, setName2Font] = useState<number>(22);

  const [active, setActive] = useState<ActiveTarget>(null);

  // drag state (1 finger)
  const [drag, setDrag] = useState<{
    isDragging: boolean;
    startTouch: Point; // page coords
    startPos: Point; // overlay coords (imageBox coords)
    target: ActiveTarget;
  }>({
    isDragging: false,
    startTouch: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    target: null,
  });

  // pinch state (2 fingers)
  const [pinch, setPinch] = useState<{
    isPinching: boolean;
    startDist: number;
    startSigSize: { w: number; h: number };
    startPos: Point;
    startFont: number;
    target: ActiveTarget;
  }>({
    isPinching: false,
    startDist: 0,
    startSigSize: { w: 0, h: 0 },
    startPos: { x: 0, y: 0 },
    startFont: 0,
    target: null,
  });

  const [isExporting, setIsExporting] = useState(false);

  const { width: screenW } = Dimensions.get("window");
  const canSign = useMemo(() => Boolean(signatureUri), [signatureUri]);

  // signature resize bounds
  const minSigW = 90;
  const maxSigW = Math.max(140, Math.round(screenW * 0.75));

  // text resize bounds
  const minFont = 12;
  const maxFont = 54;

  // Compute the exact "image box" (where Image is actually drawn with contain)
  const imageBox: Rect | null = useMemo(() => {
    if (!imgPx || containerW <= 0 || containerH <= 0) return null;

    const cw = containerW;
    const ch = containerH;
    const iw = imgPx.w;
    const ih = imgPx.h;

    // scale for contain
    const scale = Math.min(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;

    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    return { x, y, w, h };
  }, [imgPx, containerW, containerH]);

  // Clamp overlays to imageBox whenever it changes
  useEffect(() => {
    if (!imageBox) return;

    const maxXsig = Math.max(0, imageBox.w - sigSize.w);
    const maxYsig = Math.max(0, imageBox.h - sigSize.h);
    setSigPos((p) => ({
      x: clamp(p.x, 0, maxXsig),
      y: clamp(p.y, 0, maxYsig),
    }));

    const maxXtxt = Math.max(0, imageBox.w - 40);
    const maxYtxt = Math.max(0, imageBox.h - 40);
    setName1Pos((p) => ({
      x: clamp(p.x, 0, maxXtxt),
      y: clamp(p.y, 0, maxYtxt),
    }));
    setName2Pos((p) => ({
      x: clamp(p.x, 0, maxXtxt),
      y: clamp(p.y, 0, maxYtxt),
    }));
  }, [imageBox, sigSize.w, sigSize.h]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("אין הרשאה", "צריך הרשאת גישה לגלריה כדי לבחור תמונה.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (res.canceled) return;

    const uri = res.assets?.[0]?.uri;
    if (!uri) return;

    setImageUri(uri);
    setImgPx(null); // will be set by Image.getSize below

    // defaults (inside imageBox)
    setSigPos({ x: 20, y: 20 });
    setName1Pos({ x: 20, y: 140 });
    setName2Pos({ x: 20, y: 190 });

    const w = clamp(Math.round(screenW * 0.38), 140, 240);
    const h = Math.round(w * 0.5);
    setSigSize({ w, h });
  };

  // Load original image dimensions
  useEffect(() => {
    if (!imageUri) return;

    Image.getSize(
      imageUri,
      (w, h) => setImgPx({ w, h }),
      () => setImgPx(null),
    );
  }, [imageUri]);

  const onStageLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    const h = e.nativeEvent.layout.height;
    setContainerW(w);
    setContainerH(h);
  };

  // helpers to get/set target state (coords in imageBox)
  const getTargetPos = (t: ActiveTarget): Point => {
    if (t === "sig") return sigPos;
    if (t === "name1") return name1Pos;
    if (t === "name2") return name2Pos;
    return { x: 0, y: 0 };
  };

  const setTargetPos = (t: ActiveTarget, p: Point) => {
    if (t === "sig") setSigPos(p);
    else if (t === "name1") setName1Pos(p);
    else if (t === "name2") setName2Pos(p);
  };

  const getTargetFont = (t: ActiveTarget): number => {
    if (t === "name1") return name1Font;
    if (t === "name2") return name2Font;
    return 0;
  };

  const setTargetFont = (t: ActiveTarget, v: number) => {
    if (t === "name1") setName1Font(v);
    else if (t === "name2") setName2Font(v);
  };

  const onOverlayGrant = (target: ActiveTarget) => (evt: any) => {
    if (isExporting) return;
    Keyboard.dismiss();
    setActive(target);

    const touches = evt.nativeEvent.touches ?? [];
    if (touches.length >= 2) {
      const d0 = dist(touches[0], touches[1]);

      setPinch({
        isPinching: true,
        startDist: d0,
        startSigSize: { w: sigSize.w, h: sigSize.h },
        startPos: getTargetPos(target),
        startFont: getTargetFont(target),
        target,
      });

      setDrag((d) => ({ ...d, isDragging: false, target: null }));
      return;
    }

    const { pageX, pageY } = evt.nativeEvent;
    setDrag({
      isDragging: true,
      startTouch: { x: pageX, y: pageY },
      startPos: getTargetPos(target),
      target,
    });

    setPinch((p) => ({ ...p, isPinching: false, target: null }));
  };

  const onOverlayMove = (evt: any) => {
    if (isExporting) return;
    if (!imageBox) return;

    const touches = evt.nativeEvent.touches ?? [];

    // pinch
    if (touches.length >= 2) {
      const target = pinch.target ?? drag.target ?? active;
      if (!target) return;

      if (!pinch.isPinching) {
        const d0 = dist(touches[0], touches[1]);
        setPinch({
          isPinching: true,
          startDist: d0,
          startSigSize: { w: sigSize.w, h: sigSize.h },
          startPos: getTargetPos(target),
          startFont: getTargetFont(target),
          target,
        });
        setDrag((d) => ({ ...d, isDragging: false, target: null }));
        return;
      }

      const d = dist(touches[0], touches[1]);
      const scale = pinch.startDist > 0 ? d / pinch.startDist : 1;

      if (pinch.target === "sig") {
        let nextW = pinch.startSigSize.w * scale;
        nextW = clamp(nextW, minSigW, maxSigW);
        const ratio =
          pinch.startSigSize.w > 0
            ? pinch.startSigSize.h / pinch.startSigSize.w
            : 0.5;
        const nextH = nextW * ratio;

        const maxX = Math.max(0, imageBox.w - nextW);
        const maxY = Math.max(0, imageBox.h - nextH);

        const nextX = clamp(pinch.startPos.x, 0, maxX);
        const nextY = clamp(pinch.startPos.y, 0, maxY);

        setSigSize({ w: nextW, h: nextH });
        setSigPos({ x: nextX, y: nextY });
        return;
      }

      if (pinch.target === "name1" || pinch.target === "name2") {
        let nextFont = pinch.startFont * scale;
        nextFont = clamp(nextFont, minFont, maxFont);
        setTargetFont(pinch.target, nextFont);
        return;
      }

      return;
    }

    // drag
    if (!drag.isDragging || !drag.target) return;

    const { pageX, pageY } = evt.nativeEvent;
    const dx = pageX - drag.startTouch.x;
    const dy = pageY - drag.startTouch.y;

    const nextX = drag.startPos.x + dx;
    const nextY = drag.startPos.y + dy;

    if (drag.target === "sig") {
      const maxX = Math.max(0, imageBox.w - sigSize.w);
      const maxY = Math.max(0, imageBox.h - sigSize.h);
      setSigPos({ x: clamp(nextX, 0, maxX), y: clamp(nextY, 0, maxY) });
      return;
    }

    // text (loose clamp)
    const maxX = Math.max(0, imageBox.w - 40);
    const maxY = Math.max(0, imageBox.h - 40);
    setTargetPos(drag.target, {
      x: clamp(nextX, 0, maxX),
      y: clamp(nextY, 0, maxY),
    });
  };

  const onOverlayEnd = () => {
    setDrag((d) => ({ ...d, isDragging: false, target: null }));
    setPinch((p) => ({ ...p, isPinching: false, target: null }));
    setActive(null);
  };

  const isInteractingSig =
    (drag.isDragging && drag.target === "sig") ||
    (pinch.isPinching && pinch.target === "sig");
  const isInteractingName1 =
    (drag.isDragging && drag.target === "name1") ||
    (pinch.isPinching && pinch.target === "name1");
  const isInteractingName2 =
    (drag.isDragging && drag.target === "name2") ||
    (pinch.isPinching && pinch.target === "name2");

  const canExport = Boolean(imageUri && imageBox);

  const exportAndShare = async () => {
    if (!canExport) {
      Alert.alert("אין תמונה", "בחר תמונה וחכה שתיטען לפני ייצוא.");
      return;
    }

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("שיתוף לא זמין", "במכשיר/סביבה הזו אין יכולת שיתוף.");
      return;
    }

    try {
      Keyboard.dismiss();
      setIsExporting(true);

      // allow re-render without borders/hints
      await new Promise((r) => setTimeout(r, 60));

      // ✅ Capture ONLY the imageBox (exact drawn image area)
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
      Alert.alert("שגיאה בייצוא", e?.message ?? "לא הצלחתי לייצא את התמונה");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>חתימה + שמות</Text>
        <Text style={styles.sub}>
          אצבע אחת = הזזה | שתי אצבעות = שינוי גודל
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={pickImage}
          disabled={isExporting}
        >
          <Text style={styles.btnText}>בחר תמונה</Text>
        </Pressable>

        <Pressable
          style={[
            styles.btn,
            styles.exportBtn,
            (!canExport || isExporting) && styles.btnDisabled,
          ]}
          onPress={exportAndShare}
          disabled={!canExport || isExporting}
        >
          {isExporting ? (
            <View style={styles.exportLoading}>
              <ActivityIndicator />
              <Text style={styles.btnText}>מייצא…</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>ייצא ושתף</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.btn, styles.backBtn]}
          onPress={onBack}
          disabled={isExporting}
        >
          <Text style={styles.btnText}>חזרה</Text>
        </Pressable>
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם1</Text>
          <TextInput
            value={name1}
            onChangeText={setName1}
            placeholder="לדוגמה: שם מלא"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            editable={!isExporting}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם2</Text>
          <TextInput
            value={name2}
            onChangeText={setName2}
            placeholder="לדוגמה: תפקיד/מחלקה"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            editable={!isExporting}
          />
        </View>
      </View>

      {/* STAGE (for interaction + layout). We do NOT export this whole view */}
      <View
        ref={stageRef}
        collapsable={false}
        style={styles.stage}
        onLayout={onStageLayout}
      >
        {!imageUri ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>אין תמונה עדיין</Text>
            <Text style={styles.emptySub}>
              בחר תמונה כדי להתחיל למקם חתימה ושמות
            </Text>
          </View>
        ) : (
          <>
            {/* Base image (full stage, contain) */}
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />

            {/* IMAGE BOX (exact drawn image area) — overlays live here and this is what we export */}
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
                {/* We draw the image again, but now it perfectly fills the box (no letterboxing) */}
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imageBoxImg}
                  resizeMode="cover"
                />

                {/* Signature overlay (coords relative to imageBox) */}
                {canSign && signatureUri ? (
                  <View
                    style={[
                      styles.sigWrap,
                      {
                        width: sigSize.w,
                        height: sigSize.h,
                        left: sigPos.x,
                        top: sigPos.y,
                        borderWidth: isExporting ? 0 : 1,
                        borderColor: isInteractingSig
                          ? "rgba(0,0,0,0.65)"
                          : "rgba(0,0,0,0.25)",
                        backgroundColor: isExporting
                          ? "transparent"
                          : "rgba(255,255,255,0.85)",
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={onOverlayGrant("sig")}
                    onResponderMove={onOverlayMove}
                    onResponderRelease={onOverlayEnd}
                    onResponderTerminate={onOverlayEnd}
                  >
                    <Image
                      source={{ uri: signatureUri }}
                      style={styles.sigImg}
                      resizeMode="contain"
                    />
                    {!isExporting && isInteractingSig && (
                      <View style={styles.hintBubble}>
                        <Text style={styles.hintText}>
                          {pinch.isPinching ? "שנה גודל" : "גרור / צבט"}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Name 1 */}
                {name1.trim().length > 0 && (
                  <View
                    style={[
                      styles.textWrap,
                      {
                        left: name1Pos.x,
                        top: name1Pos.y,
                        borderWidth: isExporting ? 0 : 1,
                        borderColor: isInteractingName1
                          ? "rgba(0,0,0,0.65)"
                          : "rgba(0,0,0,0.25)",
                        backgroundColor: isExporting
                          ? "transparent"
                          : "rgba(255,255,255,0.85)",
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={onOverlayGrant("name1")}
                    onResponderMove={onOverlayMove}
                    onResponderRelease={onOverlayEnd}
                    onResponderTerminate={onOverlayEnd}
                  >
                    <Text style={[styles.text, { fontSize: name1Font }]}>
                      {name1}
                    </Text>
                    {!isExporting && isInteractingName1 && (
                      <View style={styles.hintBubble}>
                        <Text style={styles.hintText}>
                          {pinch.isPinching ? "שנה גודל" : "גרור / צבט"}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Name 2 */}
                {name2.trim().length > 0 && (
                  <View
                    style={[
                      styles.textWrap,
                      {
                        left: name2Pos.x,
                        top: name2Pos.y,
                        borderWidth: isExporting ? 0 : 1,
                        borderColor: isInteractingName2
                          ? "rgba(0,0,0,0.65)"
                          : "rgba(0,0,0,0.25)",
                        backgroundColor: isExporting
                          ? "transparent"
                          : "rgba(255,255,255,0.85)",
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={onOverlayGrant("name2")}
                    onResponderMove={onOverlayMove}
                    onResponderRelease={onOverlayEnd}
                    onResponderTerminate={onOverlayEnd}
                  >
                    <Text style={[styles.text, { fontSize: name2Font }]}>
                      {name2}
                    </Text>
                    {!isExporting && isInteractingName2 && (
                      <View style={styles.hintBubble}>
                        <Text style={styles.hintText}>
                          {pinch.isPinching ? "שנה גודל" : "גרור / צבט"}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b", padding: 16 },

  header: { gap: 6, marginBottom: 12 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "white", opacity: 0.7, lineHeight: 18 },

  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  btn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exportBtn: { backgroundColor: "#3a3a3a" },
  backBtn: { backgroundColor: "#1b1b1b" },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "white", fontWeight: "700" },
  exportLoading: { flexDirection: "row", gap: 8, alignItems: "center" },

  inputsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
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

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
  },
  emptyTitle: { color: "white", fontSize: 18, fontWeight: "700", opacity: 0.9 },
  emptySub: { color: "white", opacity: 0.6 },

  image: { width: "100%", height: "100%" },

  // exact drawn image area (export this)
  imageBox: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  imageBoxImg: { width: "100%", height: "100%" },

  sigWrap: {
    position: "absolute",
    borderRadius: 12,
    overflow: "hidden",
  },
  sigImg: { width: "100%", height: "100%" },

  textWrap: {
    position: "absolute",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  text: {
    color: "#000",
    fontWeight: "600",
  },

  hintBubble: {
    position: "absolute",
    right: 8,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  hintText: { color: "white", fontSize: 12, opacity: 0.9 },
});
