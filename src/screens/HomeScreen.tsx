// src/screens/HomeScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../ui/theme";
import i18n from "../i18n";
import { languageLabel, setAppLanguage, type AppLang } from "../i18n";

type Props = {
  signatureUri: string | null;
  onGoSignature: () => void;
  onGoSignImage: () => void;
  onGoSignPdf: () => void;
  onGoCamera: () => void;
};

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function ActionCard({
  title,
  subtitle,
  icon,
  accent,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  icon: string;
  accent: "green" | "purple" | "blue";
  onPress?: () => void;
  disabled?: boolean;
}) {
  const accentStyles =
    accent === "green"
      ? styles.accentGreen
      : accent === "purple"
        ? styles.accentPurple
        : styles.accentBlue;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionCard,
        disabled && styles.actionCardDisabled,
        pressed && !disabled ? styles.actionCardPressed : null,
        pressed && !disabled ? styles.actionCardPressedOutline : null,
      ]}
    >
      <View style={[styles.actionIconWrap, accentStyles]}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>

      <Text style={styles.actionTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.actionSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({
  signatureUri,
  onGoSignature,
  onGoSignImage,
  onGoSignPdf,
  onGoCamera,
}: Props) {
  const { t } = useTranslation();
  const canSign = Boolean(signatureUri);

  const [langOpen, setLangOpen] = useState(false);

  const currentLang = useMemo(() => {
    const raw = (i18n.language || "he").split("-")[0] as AppLang;
    return (["he", "en", "ar", "ru"] as AppLang[]).includes(raw) ? raw : "he";
  }, [i18n.language]);

  const langs: AppLang[] = ["he", "en", "ar", "ru"];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{t("home.avatarInitial")}</Text>
            </View>
          </View>

          {/* Language switcher */}
          <Pressable
            onPress={() => setLangOpen(true)}
            style={({ pressed }) => [
              styles.langPill,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.langText}>{languageLabel[currentLang]}</Text>
            <Text style={styles.langChevron}>▾</Text>
          </Pressable>

          <Text style={styles.appTitle}>{t("home.appTitle")}</Text>
        </View>

        <View style={styles.spacerTop} />

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t("home.welcome")}</Text>
          <Text style={styles.heroSub} numberOfLines={2}>
            {t("home.tagline")}
          </Text>
        </View>

        {/* Signature strip */}
        <Card style={styles.signatureCard}>
          <View style={styles.signatureRow}>
            <Pressable style={styles.smallBtn} onPress={onGoSignature}>
              <Text style={styles.smallBtnText}>{t("home.replace")}</Text>
            </Pressable>

            <View style={styles.sigInfo}>
              <Text style={styles.sigLabel}>
                {t("home.signaturePreviewTitle")}
              </Text>
              {!signatureUri ? (
                <Text style={styles.sigHint}>{t("home.noSignature")}</Text>
              ) : null}
            </View>

            <View style={styles.sigPreviewBox}>
              {signatureUri ? (
                <Image
                  source={{ uri: signatureUri }}
                  style={styles.sigPreview}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.sigEmptyIcon}>✍️</Text>
              )}
            </View>
          </View>

          {!canSign ? (
            <Text style={styles.noticeText}>{t("home.notice")}</Text>
          ) : null}
        </Card>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <ActionCard
            title={t("home.cameraTitle")}
            subtitle={t("home.cameraSub")}
            icon="📷"
            accent="green"
            disabled={!canSign}
            onPress={() => canSign && onGoCamera()}
          />

          <ActionCard
            title={t("home.imageTitle")}
            subtitle={t("home.imageSub")}
            icon="🖼️"
            accent="purple"
            disabled={!canSign}
            onPress={() => canSign && onGoSignImage()}
          />

          <ActionCard
            title={t("home.pdfTitle")}
            subtitle={t("home.pdfSub")}
            icon="📄"
            accent="blue"
            disabled={!canSign}
            onPress={() => canSign && onGoSignPdf()}
          />
        </View>

        {!canSign ? (
          <Text style={styles.bottomHint}>{t("home.bottomHint")}</Text>
        ) : null}

        <View style={styles.spacerBottom} />
      </View>

      {/* Language modal */}
      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <Pressable
          style={styles.langBackdrop}
          onPress={() => setLangOpen(false)}
        >
          <Pressable style={styles.langCard} onPress={() => {}}>
            <Text style={styles.langTitle}>{t("home.language")}</Text>

            <View style={{ height: 10 }} />

            {langs.map((lng) => {
              const isActive = lng === currentLang;
              return (
                <Pressable
                  key={lng}
                  style={({ pressed }) => [
                    styles.langRow,
                    isActive ? styles.langRowActive : null,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                  onPress={async () => {
                    setLangOpen(false);
                    await setAppLanguage(lng);
                  }}
                >
                  <Text style={styles.langRowText}>{languageLabel[lng]}</Text>
                  {isActive ? <Text style={styles.langCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.pagePadding,
    paddingTop: 6,
    gap: 16,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  avatarText: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },

  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    ...theme.shadow.card,
  },
  langText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  langChevron: { color: theme.colors.textSecondary, fontSize: 12 },
  appTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 18,
    marginStart: 50,
  },

  // Hero
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

  // Generic card
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    ...theme.shadow.card,
  },

  // Signature card
  signatureCard: {
    paddingVertical: 14,
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  smallBtn: {
    backgroundColor: theme.colors.buttonSecondaryBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  smallBtnText: {
    color: theme.colors.buttonSecondaryText,
    fontWeight: "800",
    fontSize: 14,
  },
  sigInfo: { flex: 1, minWidth: 0 },
  sigLabel: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  sigHint: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  sigPreviewBox: {
    width: 84,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sigPreview: { width: "100%", height: "100%" },
  sigEmptyIcon: { opacity: 0.35 },

  noticeText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // Actions row
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
    ...theme.shadow.card,
  },
  actionCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  actionCardDisabled: {
    opacity: 0.45,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: { fontSize: 22 },

  accentGreen: { backgroundColor: "rgba(34, 197, 94, 0.16)" },
  accentPurple: { backgroundColor: "rgba(109, 40, 217, 0.14)" },
  accentBlue: { backgroundColor: "rgba(37, 99, 235, 0.14)" },

  actionTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 15,
  },
  actionSubtitle: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },

  bottomHint: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  actionCardPressedOutline: {
    borderColor: theme.colors.brand,
  },
  spacerTop: { flex: 0.35 },
  spacerBottom: { flex: 1 },

  // Language modal styles
  langBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  langCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
  },
  langTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    textAlign: "right",
  },
  langRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  langRowActive: {
    borderColor: theme.colors.brand,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
  },
  langRowText: {
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  langCheck: {
    fontWeight: "900",
    color: theme.colors.brand,
  },
});
