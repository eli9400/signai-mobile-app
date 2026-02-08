import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  stage: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  sigWrap: {
    position: "absolute",
  },

  textWrap: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  text: {
    color: "#111",
    fontWeight: "900",
  },

  grabBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(109,40,217,0.25)",
    borderRadius: 14,
  },

  // active touch
  grabBorderActive: {
    borderColor: "rgba(109,40,217,0.85)",
  },

  // selected signature (even when not dragging)
  grabBorderSelected: {
    borderColor: "rgba(109,40,217,0.55)",
  },
});
