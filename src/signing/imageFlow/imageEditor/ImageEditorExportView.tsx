import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, PixelRatio, Text, View, type ViewStyle } from "react-native";
import { styles } from "./ImageEditor.styles";
import type { ImageEditState } from "../../../screens/signImage/signImageState";
import type { ImageSize } from "./types";
import type { Rect } from "../../geometry";

type ViewRef = React.ElementRef<typeof View>;

type Props = {
  visible: boolean;
  exportKind: "png" | "pdf" | null;
  imageUri: string;
  imageSize: ImageSize | null;
  imageBox: Rect | null;
  signatureUri: string | null;
  editState: ImageEditState;
  imageBoxRef: React.RefObject<ViewRef | null>;
  onReady?: () => void;
};

export default function ImageEditorExportView({
  visible,
  exportKind,
  imageUri,
  imageSize,
  imageBox,
  signatureUri,
  editState,
  imageBoxRef,
  onReady,
}: Props) {
  const signatureCount =
    editState.sigEnabled && signatureUri && Array.isArray(editState.sigItems)
      ? editState.sigItems.length
      : 0;
  const expectedImageLoads = 1 + signatureCount;
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const readySentRef = useRef(false);
  const exportPixelSize = useMemo(
    () => (imageSize ? getImageExportPixelSize(imageSize, exportKind) : null),
    [exportKind, imageSize],
  );
  const exportViewSize = useMemo(() => {
    if (!exportPixelSize) return null;

    const pixelRatio = PixelRatio.get();
    return {
      w: exportPixelSize.w / pixelRatio,
      h: exportPixelSize.h / pixelRatio,
    };
  }, [exportPixelSize]);

  useEffect(() => {
    readySentRef.current = false;
    setLoadedImageCount(0);
  }, [exportKind, imageUri, signatureUri, signatureCount]);

  useEffect(() => {
    if (!visible || !exportViewSize || !onReady) return;
    if (readySentRef.current) return;
    if (loadedImageCount < expectedImageLoads) return;

    readySentRef.current = true;
    const timer = setTimeout(onReady, 80);
    return () => clearTimeout(timer);
  }, [
    expectedImageLoads,
    exportViewSize,
    loadedImageCount,
    onReady,
    visible,
  ]);

  if (!visible || !imageSize) return null;
  if (!exportViewSize) return null;

  const handleImageLoaded = () => {
    setLoadedImageCount((count) => Math.min(count + 1, expectedImageLoads));
  };

  return (
    <View style={styles.hiddenExportContainer}>
      <View
        ref={imageBoxRef}
        collapsable={false}
        style={[
          styles.exportView,
          {
            width: exportViewSize.w,
            height: exportViewSize.h,
          } as ViewStyle,
        ]}
      >
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, styles.exportImage]}
          resizeMode="contain"
          fadeDuration={0}
          onLoadEnd={handleImageLoaded}
        />

        {(() => {
          if (!imageBox) return null;

          const scaleX = exportViewSize.w / imageBox.w;
          const scaleY = exportViewSize.h / imageBox.h;

          return (
            <>
              {editState.sigEnabled &&
                signatureUri &&
                editState.sigItems.map((sig) => (
                  <Image
                    key={sig.id}
                    source={{ uri: signatureUri }}
                    onLoadEnd={handleImageLoaded}
                    fadeDuration={0}
                    style={{
                      position: "absolute",
                      left: sig.pos.x * scaleX,
                      top: sig.pos.y * scaleY,
                      width: sig.size.w * scaleX,
                      height: sig.size.h * scaleY,
                    }}
                    resizeMode="contain"
                  />
                ))}

              {(Array.isArray(editState.textItems) ? editState.textItems : []).map(
                (txt) =>
                  txt?.text?.trim() ? (
                    <Text
                      key={txt.id}
                      style={{
                        position: "absolute",
                        left: txt.pos.x * scaleX,
                        top: txt.pos.y * scaleY,
                        fontSize: txt.font * scaleX,
                        fontWeight: "800",
                        color: "#000",
                      }}
                    >
                      {txt.text}
                    </Text>
                  ) : null,
              )}
            </>
          );
        })()}
      </View>
    </View>
  );
}

export function getImageExportPixelSize(
  imageSize: ImageSize,
  exportKind: "png" | "pdf" | null,
) {
  if (exportKind !== "pdf") return imageSize;

  const maxLongEdge = 3000;
  const longEdge = Math.max(imageSize.w, imageSize.h);
  if (longEdge <= maxLongEdge) return imageSize;

  const scale = maxLongEdge / longEdge;
  return {
    w: Math.round(imageSize.w * scale),
    h: Math.round(imageSize.h * scale),
  };
}
