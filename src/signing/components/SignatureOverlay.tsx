// src/signing/components/SignatureOverlay.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import type { Point } from "../geometry";

type Props = {
  signatureUri: string;

  pos: Point;
  size: { w: number; h: number };

  isExporting: boolean;
  isInteracting: boolean;
  isPinching: boolean;

  onGrant: (evt: any) => void;
  onMove: (evt: any) => void;
  onEnd: () => void;
};

export default function SignatureOverlay({
  signatureUri,
  pos,
  size,
  isExporting,
  isInteracting,
  isPinching,
  onGrant,
  onMove,
  onEnd,
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size.w,
          height: size.h,
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
      <Image
        source={{ uri: signatureUri }}
        style={styles.img}
        resizeMode="contain"
      />

      {!isExporting && isInteracting && (
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>
            {isPinching ? "שנה גודל" : "גרור "}
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
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
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
