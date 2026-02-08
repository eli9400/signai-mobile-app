import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { theme } from "../../ui/theme";
import { ICON_CAMERA, ICON_IMAGE, ICON_PDF } from "./homeIcons";

type Props = {
  canSign: boolean;
  onGoSignImage: () => void;
  onGoSignPdf: () => void;
  onGoCamera: () => void;
};

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: string;
  accent: "green" | "purple" | "blue";
  onPress?: () => void;
  disabled?: boolean;
};

function ActionCard({
  title,
  subtitle,
  icon,
  accent,
  onPress,
  disabled,
}: ActionCardProps) {
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

export default function ActionsRow({
  canSign,
  onGoSignImage,
  onGoSignPdf,
  onGoCamera,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.actionsRow}>
      <ActionCard
        title={t("home.cameraTitle")}
        subtitle={t("home.cameraSub")}
        icon={ICON_CAMERA}
        accent="green"
        disabled={!canSign}
        onPress={() => canSign && onGoCamera()}
      />

      <ActionCard
        title={t("home.imageTitle")}
        subtitle={t("home.imageSub")}
        icon={ICON_IMAGE}
        accent="purple"
        disabled={!canSign}
        onPress={() => canSign && onGoSignImage()}
      />

      <ActionCard
        title={t("home.pdfTitle")}
        subtitle={t("home.pdfSub")}
        icon={ICON_PDF}
        accent="blue"
        disabled={!canSign}
        onPress={() => canSign && onGoSignPdf()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  actionCardPressedOutline: {
    borderColor: theme.colors.brand,
  },
});
