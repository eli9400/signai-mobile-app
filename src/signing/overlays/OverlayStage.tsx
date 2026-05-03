import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useOverlayGestures } from "../hooks/useOverlayGestures";
import type { Point, Rect } from "../geometry";
import OverlaySignatures from "./OverlaySignatures";
import { styles } from "./OverlayStage.styles";
import type { OverlayStageProps, Size } from "./OverlayStage.types";
import OverlayTextLayer from "./OverlayTextLayer";
import { calcContainRect } from "./overlayStageUtils";

export default function OverlayStage({
  imageUri,
  imageSize,
  isDisabled,

  signatureUri,

  sigEnabled = false,
  sigItems,
  setSigItems,
  activeSigId,
  setActiveSigId,

  minSigW,
  maxSigW,
  textItems,
  setTextItems,
  activeTextId,
  setActiveTextId,

  minFont,
  maxFont,
  isPinchEnabled = true,
  textClampPadding = 40,
  onInteractionStart,
  onInteractionEnd,

  pageScale = 1,
  onImageRect,
}: OverlayStageProps) {
  const [stageSize, setStageSize] = useState<Size>({ w: 0, h: 0 });

  const imageRectInStage = useMemo(() => {
    return calcContainRect(stageSize.w, stageSize.h, imageSize.w, imageSize.h);
  }, [stageSize.w, stageSize.h, imageSize.w, imageSize.h]);

  useEffect(() => {
    if (!onImageRect) return;
    if (!imageRectInStage.w || !imageRectInStage.h) return;
    onImageRect(imageRectInStage);
  }, [imageRectInStage, onImageRect]);

  const imageBoxForGestures: Rect | null = useMemo(() => {
    if (!imageRectInStage.w || !imageRectInStage.h) return null;
    return { x: 0, y: 0, w: imageRectInStage.w, h: imageRectInStage.h };
  }, [imageRectInStage.w, imageRectInStage.h]);

  const gestures = useOverlayGestures({
    imageBox: imageBoxForGestures,
    isDisabled,
    isPinchEnabled,

    sigItems,
    setSigItems,
    activeSigId,
    setActiveSigId,

    minSigW,
    maxSigW,
    textItems,
    setTextItems,
    activeTextId,
    setActiveTextId,

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

      <OverlaySignatures
        sigEnabled={sigEnabled}
        signatureUri={signatureUri}
        sigItems={sigItems}
        activeSigId={activeSigId}
        isDisabled={isDisabled}
        abs={abs}
        gestures={gestures}
      />

      <OverlayTextLayer
        textItems={textItems}
        activeTextId={activeTextId}
        isDisabled={isDisabled}
        abs={abs}
        gestures={gestures}
      />
    </View>
  );
}
