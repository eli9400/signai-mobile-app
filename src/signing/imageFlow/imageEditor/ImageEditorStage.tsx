import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import StageBackground from "../../components/StageBackground";
import OverlayStage from "../../overlays/OverlayStage";
import { styles } from "./ImageEditor.styles";
import type { ImageEditState } from "../../../screens/signImage/signImageState";
import type { ImageSize } from "./types";
import type { Rect } from "../../geometry";

type Props = {
  imageUri: string;
  imageSize: ImageSize | null;
  setImageSize: (size: ImageSize) => void;
  isExporting: boolean;
  imageBox: Rect | null;
  onStageLayout: (e: LayoutChangeEvent) => void;
  shouldSetResponder: () => boolean;
  onStageStart: (e: any) => void;
  onStageMove: (e: any) => void;
  onStageEnd: () => void;
  pageScale: number;
  pageTx: number;
  pageTy: number;
  signatureUri: string | null;
  editState: ImageEditState;
  setEditState: React.Dispatch<React.SetStateAction<ImageEditState>>;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  loadingText: string;
};

export default function ImageEditorStage({
  imageUri,
  imageSize,
  setImageSize,
  isExporting,
  imageBox,
  onStageLayout,
  shouldSetResponder,
  onStageStart,
  onStageMove,
  onStageEnd,
  pageScale,
  pageTx,
  pageTy,
  signatureUri,
  editState,
  setEditState,
  onInteractionStart,
  onInteractionEnd,
  loadingText,
}: Props) {
  const safeSigItems = Array.isArray(editState.sigItems) ? editState.sigItems : [];

  return (
    <View style={styles.stageWrap} onLayout={onStageLayout}>
      <View style={[styles.imageContainer, isExporting && styles.imageContainerExport]}>
        <StageBackground />
        <View collapsable={false} style={styles.captureView}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              imageBox && !isExporting ? styles.imageHidden : null,
            ]}
            resizeMode="contain"
            onLoad={(e) => {
              const src = e.nativeEvent?.source;
              if (src?.width && src?.height) {
                setImageSize({ w: src.width, h: src.height });
              }
            }}
            onError={() => {}}
          />

          {imageBox && imageSize && !isExporting ? (
            <View
              style={[
                styles.overlayBox,
                {
                  left: imageBox.x,
                  top: imageBox.y,
                  width: imageBox.w,
                  height: imageBox.h,
                },
              ]}
              onStartShouldSetResponder={shouldSetResponder}
              onMoveShouldSetResponder={shouldSetResponder}
              onResponderGrant={onStageStart}
              onResponderMove={onStageMove}
              onResponderRelease={onStageEnd}
              onResponderTerminate={onStageEnd}
            >
              <View
                style={[
                  styles.stageTransform,
                  {
                    transform: [
                      { translateX: pageTx },
                      { translateY: pageTy },
                      { scale: pageScale },
                    ],
                  },
                ]}
                pointerEvents="box-none"
              >
                <OverlayStage
                  imageUri={imageUri}
                  imageSize={imageSize}
                  signatureUri={signatureUri}
                  sigItems={safeSigItems}
                  setSigItems={(itemsOrUpdater) => {
                    setEditState((prev) => {
                      const currentItems = Array.isArray(prev.sigItems)
                        ? prev.sigItems
                        : [];

                      const newItems =
                        typeof itemsOrUpdater === "function"
                          ? itemsOrUpdater(currentItems)
                          : itemsOrUpdater;

                      const safeItems = Array.isArray(newItems) ? newItems : [];
                      return { ...prev, sigItems: safeItems };
                    });
                  }}
                  activeSigId={editState.activeSigId}
                  setActiveSigId={(id) =>
                    setEditState((prev) => ({ ...prev, activeSigId: id }))
                  }
                  sigEnabled={editState.sigEnabled}
                  name1={editState.name1}
                  setName1={(name1) =>
                    setEditState((prev) => ({ ...prev, name1 }))
                  }
                  name1Pos={editState.name1Pos}
                  setName1Pos={(name1Pos) =>
                    setEditState((prev) => ({ ...prev, name1Pos }))
                  }
                  name1Font={editState.name1Font}
                  setName1Font={(name1Font) =>
                    setEditState((prev) => ({ ...prev, name1Font }))
                  }
                  name2={editState.name2}
                  setName2={(name2) =>
                    setEditState((prev) => ({ ...prev, name2 }))
                  }
                  name2Pos={editState.name2Pos}
                  setName2Pos={(name2Pos) =>
                    setEditState((prev) => ({ ...prev, name2Pos }))
                  }
                  name2Font={editState.name2Font}
                  setName2Font={(name2Font) =>
                    setEditState((prev) => ({ ...prev, name2Font }))
                  }
                  pageScale={pageScale}
                  isDisabled={false}
                  onInteractionStart={onInteractionStart}
                  onInteractionEnd={onInteractionEnd}
                />
              </View>
            </View>
          ) : null}
        </View>

        {!imageSize && !isExporting ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
