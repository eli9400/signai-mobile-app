import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function StageBackground() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <Image
        source={require("../../../assets/splash-icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 160,
    height: 160,
    opacity: 0.08,
  },
});
