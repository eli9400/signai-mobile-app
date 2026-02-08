import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { theme } from "../../ui/theme";

export default function HomeHero() {
  const { t } = useTranslation();

  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>{t("home.welcome")}</Text>
      <Text style={styles.heroSub} numberOfLines={2}>
        {t("home.tagline")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.10)",
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    ...theme.typography.h1,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  heroSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    ...theme.typography.body,
    textAlign: "center",
  },
});
