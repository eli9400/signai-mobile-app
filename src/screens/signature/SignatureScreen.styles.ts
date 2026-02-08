import { StyleSheet } from "react-native";
import { theme } from "../../ui/theme";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.pagePadding,
    paddingTop: 6,
    gap: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  appTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 18,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  closeBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  hero: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.10)",
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 14,
    gap: 12,
    ...theme.shadow.card,
  },
  canvasWrap: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F6FF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  web: { flex: 1, backgroundColor: "#F3F6FF" },
  row: { flexDirection: "row", gap: 10 },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: theme.colors.buttonSecondaryBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  btnSecondaryText: {
    color: theme.colors.buttonSecondaryText,
    fontWeight: "900",
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: theme.colors.brand,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "900",
  },
  btnDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  btnDangerText: {
    color: "rgba(239, 68, 68, 1)",
    fontWeight: "900",
  },
  spacerBottom: { flex: 1 },
});
