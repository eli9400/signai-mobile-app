import { View, Text, ActivityIndicator } from "react-native";
import type { Rect } from "../../geometry";
import StageBackground from "../../components/StageBackground";
import OverlayStage from "../../overlays/OverlayStage";
import type { OverlayStageProps } from "../../overlays/OverlayStage.types";
import { styles } from "./PdfPageEditor.styles";

type OverlayState = Omit<
  OverlayStageProps,
  | "imageUri"
  | "imageSize"
  | "pageScale"
  | "onInteractionStart"
  | "onInteractionEnd"
  | "onImageRect"
  | "isDisabled"
>;

type Props = {
  canShowStage: boolean;
  pngDataUrl: string | null;
  pngSize: { w: number; h: number } | null;
  overlayState: OverlayState;
  pageScale: number;
  pageTx: number;
  pageTy: number;
  shouldSetResponder: () => boolean;
  onStageStart: (e: any) => void;
  onStageMove: (e: any) => void;
  onStageEnd: () => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  onImageRect?: (rect: Rect) => void;
  loadingLabel: string;
};

export default function PdfPageEditorStage({
  canShowStage,
  pngDataUrl,
  pngSize,
  overlayState,
  pageScale,
  pageTx,
  pageTy,
  shouldSetResponder,
  onStageStart,
  onStageMove,
  onStageEnd,
  onInteractionStart,
  onInteractionEnd,
  onImageRect,
  loadingLabel,
}: Props) {
  return (
    <View style={styles.stageWrap}>
      <StageBackground />
      {canShowStage ? (
        <View
          style={styles.stageResponder}
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
              imageUri={pngDataUrl!}
              imageSize={pngSize!}
              pageScale={pageScale}
              isDisabled={false}
              onInteractionStart={onInteractionStart}
              onInteractionEnd={onInteractionEnd}
              onImageRect={onImageRect}
              {...overlayState}
            />
          </View>
        </View>
      ) : (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={{ opacity: 0.75, fontWeight: "800", color: "white" }}>
            {loadingLabel}
          </Text>
        </View>
      )}
    </View>
  );
}
