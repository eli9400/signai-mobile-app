import React from "react";
import { Image, Text, View, type ViewStyle } from "react-native";
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
}: Props) {
  if (!visible || !imageSize) return null;

  const exportSize = getExportSize(imageSize, exportKind);

  return (
    <View style={styles.hiddenExportContainer}>
      <View
        ref={imageBoxRef}
        collapsable={false}
        style={[
          styles.exportView,
          {
            width: exportSize.w,
            height: exportSize.h,
          } as ViewStyle,
        ]}
      >
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {(() => {
          if (!imageBox) return null;

          const scaleX = exportSize.w / imageBox.w;
          const scaleY = exportSize.h / imageBox.h;

          return (
            <>
              {editState.sigEnabled &&
                signatureUri &&
                editState.sigItems.map((sig) => (
                  <Image
                    key={sig.id}
                    source={{ uri: signatureUri }}
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

function getExportSize(
  imageSize: ImageSize,
  exportKind: "png" | "pdf" | null,
) {
  if (exportKind !== "pdf") return imageSize;

  const maxLongEdge = 1800;
  const longEdge = Math.max(imageSize.w, imageSize.h);
  if (longEdge <= maxLongEdge) return imageSize;

  const scale = maxLongEdge / longEdge;
  return {
    w: Math.round(imageSize.w * scale),
    h: Math.round(imageSize.h * scale),
  };
}
