import React from "react";
import { Image, Text, View, type ViewStyle } from "react-native";
import { styles } from "./ImageEditor.styles";
import type { ImageEditState } from "../../../screens/signImage/signImageState";
import type { ImageSize } from "./types";
import type { Rect } from "../../geometry";

type ViewRef = React.ElementRef<typeof View>;

type Props = {
  visible: boolean;
  imageUri: string;
  imageSize: ImageSize | null;
  imageBox: Rect | null;
  signatureUri: string | null;
  editState: ImageEditState;
  imageBoxRef: React.RefObject<ViewRef | null>;
};

export default function ImageEditorExportView({
  visible,
  imageUri,
  imageSize,
  imageBox,
  signatureUri,
  editState,
  imageBoxRef,
}: Props) {
  if (!visible || !imageSize) return null;

  return (
    <View style={styles.hiddenExportContainer}>
      <View
        ref={imageBoxRef}
        collapsable={false}
        style={[
          styles.exportView,
          {
            width: imageSize.w,
            height: imageSize.h,
          } as ViewStyle,
        ]}
      >
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {(() => {
          if (!imageBox) return null;

          const scaleX = imageSize.w / imageBox.w;
          const scaleY = imageSize.h / imageBox.h;

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
