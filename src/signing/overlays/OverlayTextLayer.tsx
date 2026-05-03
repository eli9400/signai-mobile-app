import { Text, View } from "react-native";
import type { Point } from "../geometry";
import type { TextItem } from "../hooks/useOverlayGestures";
import type { useOverlayGestures } from "../hooks/useOverlayGestures";
import { styles } from "./OverlayStage.styles";

type AbsFn = (p: Point) => { left: number; top: number };
type Gestures = ReturnType<typeof useOverlayGestures>;

type Props = {
  textItems: TextItem[];
  activeTextId: string | null;
  isDisabled?: boolean;
  abs: AbsFn;
  gestures: Gestures;
};

export default function OverlayTextLayer({
  textItems,
  activeTextId,
  isDisabled,
  abs,
  gestures,
}: Props) {
  const safeTextItems = Array.isArray(textItems) ? textItems : [];

  return (
    <>
      {safeTextItems.map((item) => {
        if (!item?.text?.trim()) return null;

        const isActive =
          gestures.interactingTextId === item.id || activeTextId === item.id;

        return (
          <View
            key={item.id}
            style={[
              styles.textWrap,
              {
                ...abs(item.pos),
                opacity: isDisabled ? 0.6 : 1,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={gestures.onOverlayGrant({
              kind: "text",
              id: item.id,
            })}
            onResponderMove={gestures.onOverlayMove}
            onResponderRelease={gestures.onOverlayEnd}
            onResponderTerminate={gestures.onOverlayEnd}
          >
            <Text style={[styles.text, { fontSize: item.font }]}>{item.text}</Text>
            <View
              pointerEvents="none"
              style={[styles.grabBorder, isActive && styles.grabBorderActive]}
            />
          </View>
        );
      })}
    </>
  );
}
