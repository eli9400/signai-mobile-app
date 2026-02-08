import { Text, View } from "react-native";
import type { Point } from "../geometry";
import type { useOverlayGestures } from "../hooks/useOverlayGestures";
import { styles } from "./OverlayStage.styles";

type AbsFn = (p: Point) => { left: number; top: number };
type Gestures = ReturnType<typeof useOverlayGestures>;

type Props = {
  name1: string;
  name1Pos: Point;
  name1Font: number;
  name2: string;
  name2Pos: Point;
  name2Font: number;
  isDisabled?: boolean;
  abs: AbsFn;
  gestures: Gestures;
};

export default function OverlayTextLayer({
  name1,
  name1Pos,
  name1Font,
  name2,
  name2Pos,
  name2Font,
  isDisabled,
  abs,
  gestures,
}: Props) {
  return (
    <>
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
    </>
  );
}
