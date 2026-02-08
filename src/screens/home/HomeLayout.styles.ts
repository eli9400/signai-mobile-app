import { StyleSheet } from "react-native";
import { theme } from "../../ui/theme";

export const layoutStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.pagePadding,
    paddingTop: 6,
    gap: 16,
  },
  spacerTop: { flex: 0.35 },
  spacerBottom: { flex: 1 },
  bottomHint: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
