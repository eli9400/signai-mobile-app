import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  actions: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6d28d9",
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 2,
  },
  primaryText: { color: "white", fontWeight: "900", fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(109,40,217,0.35)",
  },
  secondaryText: {
    color: "#6d28d9",
    fontWeight: "900",
    fontSize: 15,
  },
  disabled: { opacity: 0.5 },
});
