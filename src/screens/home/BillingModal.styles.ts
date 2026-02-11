import { StyleSheet } from "react-native";
import { theme } from "../../ui/theme";

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    textAlign: "right",
  },
  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
  priceNote: {
    marginTop: 6,
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
  warning: {
    marginTop: 8,
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "right",
  },
  cardField: { height: 50, marginTop: 14 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "white", fontWeight: "900" },
});
