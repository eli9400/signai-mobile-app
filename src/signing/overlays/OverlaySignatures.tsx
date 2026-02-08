import { Image, StyleSheet, View } from "react-native";
import type { Point } from "../geometry";
import type { SigItem } from "../hooks/useOverlayGestures";
import type { useOverlayGestures } from "../hooks/useOverlayGestures";
import { styles } from "./OverlayStage.styles";

type AbsFn = (p: Point) => { left: number; top: number };
type Gestures = ReturnType<typeof useOverlayGestures>;

type Props = {
  sigEnabled: boolean;
  signatureUri: string | null;
  sigItems: SigItem[];
  activeSigId: string | null;
  isDisabled?: boolean;
  abs: AbsFn;
  gestures: Gestures;
};

export default function OverlaySignatures({
  sigEnabled,
  signatureUri,
  sigItems,
  activeSigId,
  isDisabled,
  abs,
  gestures,
}: Props) {
  const canShowSigs =
    Boolean(signatureUri) && sigEnabled && (sigItems?.length ?? 0) > 0;

  if (!canShowSigs) return null;

  return (
    <>
      {sigItems.map((sig) => {
        const isActive = sig.id === activeSigId;

        return (
          <View
            key={sig.id}
            style={[
              styles.sigWrap,
              {
                ...abs(sig.pos),
                width: sig.size.w,
                height: sig.size.h,
                opacity: isDisabled ? 0.6 : 1,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={gestures.onOverlayGrant({
              kind: "sig",
              id: sig.id,
            })}
            onResponderMove={gestures.onOverlayMove}
            onResponderRelease={gestures.onOverlayEnd}
            onResponderTerminate={gestures.onOverlayEnd}
          >
            {signatureUri && (
              <Image
                source={{ uri: String(signatureUri) }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            )}

            <View
              pointerEvents="none"
              style={[
                styles.grabBorder,
                isActive && styles.grabBorderSelected,
                gestures.isInteractingSig && isActive && styles.grabBorderActive,
              ]}
            />
          </View>
        );
      })}
    </>
  );
}
