// src/ui/theme.ts
import { Platform } from "react-native";

export const theme = {
  // Background like the screenshot (soft bluish/gray)
  colors: {
    appBg: "#F4F7FF",
    cardBg: "#FFFFFF",
    cardBorder: "rgba(15, 23, 42, 0.08)", // subtle slate border
    textPrimary: "#0F172A", // slate-900
    textSecondary: "rgba(15, 23, 42, 0.6)",
    brand: "#6D28D9", // purple accent (outline)
    brandSoft: "rgba(109, 40, 217, 0.12)",
    buttonPrimary: "#2563EB", // blue
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryBg: "rgba(15, 23, 42, 0.06)",
    buttonSecondaryText: "#0F172A",
  },

  radius: {
    xl: 20,
    lg: 16,
    md: 12,
  },

  spacing: {
    pagePadding: 20,
    gapLg: 18,
    gapMd: 12,
    gapSm: 8,
  },

  typography: {
    h1: { fontSize: 34, fontWeight: "800" as const },
    h2: { fontSize: 22, fontWeight: "800" as const },
    body: { fontSize: 16, fontWeight: "500" as const },
    small: { fontSize: 13, fontWeight: "500" as const },
  },

  // soft card shadow similar to web screenshot
  shadow: {
    card: Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
};
