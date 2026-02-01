import React, { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useOverlayGestures } from "../hooks/useOverlayGestures";
import type { Point, Rect } from "../geometry";

type Size = { w: number; h: number };

type Props = {
  imageUri: string;
  imageSize: Size;
  isDisabled?: boolean;

  signatureUri: string | null;
  sigPos: Point;
  setSigPos: (p: Point) => void;
  sigSize: Size;
  setSigSize: (s: Size) => void;

  name1: string;
  setName1: (s: string) => void;
  name1Pos: Point;
  setName1Pos: (p: Point) => void;
  name1Font: number;
  setName1Font: (n: number) => void;

  name2: string;
  setName2: (s: string) => void;
  name2Pos: Point;
  setName2Pos: (p: Point) => void;
  name2Font: number;
  setName2Font: (n: number) => void;

  minSigW?: number;
  maxSigW?: number;
  minFont?: number;
  maxFont?: number;

  isPinchEnabled?: boolean;
  textClampPadding?: number;

  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;

  // ✅ page scale for coordinate correction
  pageScale?: number;
};

function calcContainRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): Rect {
  if (!containerW || !containerH || !contentW || !contentH) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  const scale = Math.min(containerW / contentW, containerH / contentH);
  const w = contentW * scale;
  const h = contentH * scale;
  const x = (containerW - w) / 2;
  const y = (containerH - h) / 2;

  return { x, y, w, h };
}

export default function OverlayStage({
  imageUri,
  imageSize,
  isDisabled,
  signatureUri,
  sigPos,
  setSigPos,
  sigSize,
  setSigSize,
  minSigW,
  maxSigW,
  name1,
  setName1,
  name1Pos,
  setName1Pos,
  name1Font,
  setName1Font,
  name2,
  setName2,
  name2Pos,
  setName2Pos,
  name2Font,
  setName2Font,
  minFont,
  maxFont,
  isPinchEnabled = true,
  textClampPadding = 40,
  onInteractionStart,
  onInteractionEnd,
  pageScale = 1,
}: Props) {
  const [stageSize, setStageSize] = useState<Size>({ w: 0, h: 0 });

  const imageRectInStage = useMemo(() => {
    return calcContainRect(stageSize.w, stageSize.h, imageSize.w, imageSize.h);
  }, [stageSize.w, stageSize.h, imageSize.w, imageSize.h]);

  const imageBoxForGestures: Rect | null = useMemo(() => {
    if (!imageRectInStage.w || !imageRectInStage.h) return null;
    return { x: 0, y: 0, w: imageRectInStage.w, h: imageRectInStage.h };
  }, [imageRectInStage.w, imageRectInStage.h]);

  const gestures = useOverlayGestures({
    imageBox: imageBoxForGestures,
    isDisabled,
    isPinchEnabled,
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
    textClampPadding,
    onInteractionStart,
    onInteractionEnd,
    pageScale,
  });

  const abs = (p: Point) => ({
    left: imageRectInStage.x + p.x,
    top: imageRectInStage.y + p.y,
  });

  const canShowSig = Boolean(signatureUri);

  return (
    <View
      style={styles.stage}
      onLayout={(e) => {
        setStageSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        });
      }}
    >
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />

      {canShowSig && (
        <View
          style={[
            styles.sigWrap,
            {
              ...abs(sigPos),
              width: sigSize.w,
              height: sigSize.h,
              opacity: isDisabled ? 0.6 : 1,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={gestures.onOverlayGrant("sig")}
          onResponderMove={gestures.onOverlayMove}
          onResponderRelease={gestures.onOverlayEnd}
          onResponderTerminate={gestures.onOverlayEnd}
        >
          <Image
            source={{ uri: String(signatureUri) }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
          <View
            pointerEvents="none"
            style={[
              styles.grabBorder,
              gestures.isInteractingSig && styles.grabBorderActive,
            ]}
          />
        </View>
      )}

      {Boolean(name1?.trim()) && (
        <View
          style={[
            styles.textWrap,
            {
              ...abs(name1Pos),
              opacity: isDisabled ? 0.6 : 1,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={gestures.onOverlayGrant("name1")}
          onResponderMove={gestures.onOverlayMove}
          onResponderRelease={gestures.onOverlayEnd}
          onResponderTerminate={gestures.onOverlayEnd}
        >
          <Text style={[styles.text, { fontSize: name1Font }]}>{name1}</Text>
          <View
            pointerEvents="none"
            style={[
              styles.grabBorder,
              gestures.isInteractingName1 && styles.grabBorderActive,
            ]}
          />
        </View>
      )}

      {Boolean(name2?.trim()) && (
        <View
          style={[
            styles.textWrap,
            {
              ...abs(name2Pos),
              opacity: isDisabled ? 0.6 : 1,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={gestures.onOverlayGrant("name2")}
          onResponderMove={gestures.onOverlayMove}
          onResponderRelease={gestures.onOverlayEnd}
          onResponderTerminate={gestures.onOverlayEnd}
        >
          <Text style={[styles.text, { fontSize: name2Font }]}>{name2}</Text>
          <View
            pointerEvents="none"
            style={[
              styles.grabBorder,
              gestures.isInteractingName2 && styles.grabBorderActive,
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  sigWrap: {
    position: "absolute",
  },
  textWrap: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  text: {
    color: "#111",
    fontWeight: "900",
  },
  grabBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(109,40,217,0.25)",
    borderRadius: 14,
  },
  grabBorderActive: {
    borderColor: "rgba(109,40,217,0.85)",
  },
});
