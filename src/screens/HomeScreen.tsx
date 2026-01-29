// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../ui/theme";

type Props = {
  signatureUri: string | null;
  onGoSignature: () => void;
  onGoSignImage: () => void;
  onGoSignPdf: () => void;

  // NOTE:
  // We'll add later:
  // onGoCamera?: () => void;
  // onOpenHistory?: () => void;
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
}: Props) {
  const canSign = Boolean(signatureUri);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>א</Text>
            </View>
          </View>

          {/* Placeholder language switcher (we'll wire real i18n later) */}
          <View style={styles.langPill}>
            <Text style={styles.langText}>עברית</Text>
            <Text style={styles.langChevron}>▾</Text>
          </View>

          <Text style={styles.appTitle}>חתימת מסמכים</Text>
        </View>
        <View style={styles.spacerTop} />

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>ברוכים הבאים </Text>
          <Text style={styles.heroSub} numberOfLines={2}>
            טעינה, חתימה וייצוא מסמכים — בקלות
          </Text>
        </View>

        {/* Signature strip */}
        <Card style={styles.signatureCard}>
          <View style={styles.signatureRow}>
            <Pressable style={styles.smallBtn} onPress={onGoSignature}>
              <Text style={styles.smallBtnText}>החלף</Text>
            </Pressable>

            <View style={styles.sigInfo}>
              <Text style={styles.sigLabel}>תצוגה מקדימה של חתימה</Text>
              {!signatureUri ? (
                <Text style={styles.sigHint}>אין חתימה שמורה עדיין</Text>
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
            <Text style={styles.noticeText}>
              💡 צור חתימה תחילה כדי להתחיל לחתום על מסמכים
            </Text>
          ) : null}
        </Card>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <ActionCard
            title="צלם תמונה"
            subtitle="פתח מצלמה לצילום"
            icon="📷"
            accent="green"
            disabled
            onPress={() => {}}
          />

          <ActionCard
            title="טען תמונה"
            subtitle="טען תמונה והוסף חתימה"
            icon="🖼️"
            accent="purple"
            disabled={!canSign}
            onPress={() => canSign && onGoSignImage()}
          />

          <ActionCard
            title="טען PDF"
            subtitle="טען מסמך PDF לחתימה"
            icon="📄"
            accent="blue"
            disabled={!canSign}
            onPress={() => canSign && onGoSignPdf()}
          />
        </View>

        {!canSign ? (
          <Text style={styles.bottomHint}>
            כדי להפעיל חתימה על מסמכים — קודם צור חתימה.
          </Text>
        ) : null}
        <View style={styles.spacerBottom} />
      </View>
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
    fontSize: 28, // a bit smaller for mobile
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
});
