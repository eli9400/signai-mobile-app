// src/screens/SignImageScreen.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import {
  clamp,
  calcImageBox,
  clampPosInsideBox,
  clampPosLoose,
  type Point,
  type Rect,
} from "../signing/geometry";
import { useOverlayGestures } from "../signing/hooks/useOverlayGestures";
import { exportAndSharePng } from "../signing/export/exportAndSharePng";

import SigningToolbar from "../signing/components/SigningToolbar";
import SignatureOverlay from "../signing/components/SignatureOverlay";
import TextOverlay from "../signing/components/TextOverlay";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
};

export default function SignImageScreen({ signatureUri, onBack }: Props) {
  const stageRef = useRef<View>(null);
  const imageBoxRef = useRef<View>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
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

  const [isExporting, setIsExporting] = useState(false);

  const { width: screenW } = Dimensions.get("window");
  const canSign = Boolean(signatureUri);

  const minSigW = 90;
  const maxSigW = Math.max(140, Math.round(screenW * 0.75));
  const minFont = 12;
  const maxFont = 54;

  const imageBox: Rect | null = useMemo(() => {
    if (!imgPx) return null;
    return calcImageBox(containerW, containerH, imgPx.w, imgPx.h);
  }, [imgPx, containerW, containerH]);

  useEffect(() => {
    if (!imageBox) return;
    setSigPos((p) => clampPosInsideBox(p, imageBox, sigSize.w, sigSize.h));
    setName1Pos((p) => clampPosLoose(p, imageBox, 40));
    setName2Pos((p) => clampPosLoose(p, imageBox, 40));
  }, [imageBox, sigSize.w, sigSize.h]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("אין הרשאה", "צריך הרשאת גישה לגלריה כדי לבחור תמונה.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;

    setImageUri(uri);
    setImgPx(null);

    setSigPos({ x: 20, y: 20 });
    setName1Pos({ x: 20, y: 140 });
    setName2Pos({ x: 20, y: 190 });

    const w = clamp(Math.round(screenW * 0.38), 140, 240);
    setSigSize({ w, h: Math.round(w * 0.5) });
  };

  useEffect(() => {
    if (!imageUri) return;
    Image.getSize(
      imageUri,
      (w, h) => setImgPx({ w, h }),
      () => setImgPx(null),
    );
  }, [imageUri]);

  const onStageLayout = (e: any) => {
    setContainerW(e.nativeEvent.layout.width);
    setContainerH(e.nativeEvent.layout.height);
  };

  const {
    pinch,
    onOverlayGrant,
    onOverlayMove,
    onOverlayEnd,
    isInteractingSig,
    isInteractingName1,
    isInteractingName2,
  } = useOverlayGestures({
    imageBox,
    isDisabled: isExporting,

    sigSize,
    setSigSize,
    sigPos,
    setSigPos,
    minSigW,
    maxSigW,

    name1Pos,
    setName1Pos,
    name1Font,
    setName1Font,

    name2Pos,
    setName2Pos,
    name2Font,
    setName2Font,

    minFont,
    maxFont,

    textClampPadding: 40,
  });

  const canExport = Boolean(imageUri && imageBox);

  const exportAndShare = async () => {
    if (!canExport) {
      Alert.alert("אין תמונה", "בחר תמונה וחכה שתיטען לפני ייצוא.");
      return;
    }

    try {
      Keyboard.dismiss();
      setIsExporting(true);

      await exportAndSharePng({
        viewRef: imageBoxRef,
        beforeCaptureDelayMs: 60,
        dialogTitle: "שתף תמונה חתומה",
      });
    } catch (e: any) {
      Alert.alert("שגיאה בייצוא", e?.message ?? "לא הצלחתי לייצא את התמונה");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <SigningToolbar
        name1={name1}
        name2={name2}
        setName1={setName1}
        setName2={setName2}
        isExporting={isExporting}
        canExport={canExport}
        onPickImage={pickImage}
        onExport={exportAndShare}
        onBack={onBack}
      />

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

                {canSign && signatureUri ? (
                  <SignatureOverlay
                    signatureUri={signatureUri}
                    pos={sigPos}
                    size={sigSize}
                    isExporting={isExporting}
                    isInteracting={isInteractingSig}
                    isPinching={pinch.isPinching}
                    onGrant={onOverlayGrant("sig")}
                    onMove={onOverlayMove}
                    onEnd={onOverlayEnd}
                  />
                ) : null}

                <TextOverlay
                  text={name1}
                  pos={name1Pos}
                  fontSize={name1Font}
                  isExporting={isExporting}
                  isInteracting={isInteractingName1}
                  isPinching={pinch.isPinching}
                  onGrant={onOverlayGrant("name1")}
                  onMove={onOverlayMove}
                  onEnd={onOverlayEnd}
                />

                <TextOverlay
                  text={name2}
                  pos={name2Pos}
                  fontSize={name2Font}
                  isExporting={isExporting}
                  isInteracting={isInteractingName2}
                  isPinching={pinch.isPinching}
                  onGrant={onOverlayGrant("name2")}
                  onMove={onOverlayMove}
                  onEnd={onOverlayEnd}
                />
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

  imageBox: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  imageBoxImg: { width: "100%", height: "100%" },
});
