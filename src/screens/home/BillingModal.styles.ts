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
  loadingRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    textAlign: "right",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textAlign: "right",
  },
  productsWrap: {
    marginTop: 14,
  },
  productBtn: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productBtnSpacing: {
    marginTop: 10,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    textAlign: "right",
  },
  productSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textAlign: "right",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.textPrimary,
  },
  premiumBtn: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
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
