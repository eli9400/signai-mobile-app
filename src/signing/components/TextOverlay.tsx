// src/signing/components/TextOverlay.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Point } from "../geometry";

type Props = {
  text: string;
  pos: Point;
  fontSize: number;

  isExporting: boolean;
  isInteracting: boolean;
  isPinching: boolean;

  onGrant: (evt: any) => void;
  onMove: (evt: any) => void;
  onEnd: () => void;
};

export default function TextOverlay({
  text,
  pos,
  fontSize,
  isExporting,
  isInteracting,
  isPinching,
  onGrant,
  onMove,
  onEnd,
}: Props) {
  if (!text.trim()) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          left: pos.x,
          top: pos.y,
          borderWidth: isExporting ? 0 : 1,
          borderColor: isInteracting ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.25)",
          backgroundColor: isExporting
            ? "transparent"
            : "rgba(255,255,255,0.85)",
        },
      ]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onEnd}
      onResponderTerminate={onEnd}
    >
      <Text style={[styles.text, { fontSize }]}>{text}</Text>

      {!isExporting && isInteracting && (
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>
            {isPinching ? "שנה גודל" : "גרור / צבט"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  text: {
    color: "#000",
    fontWeight: "600",
  },
  hintBubble: {
    position: "absolute",
    right: 8,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  hintText: { color: "white", fontSize: 12, opacity: 0.9 },
});
