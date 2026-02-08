import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { theme } from "../../ui/theme";
import { ICON_SIGNATURE_EMPTY } from "./homeIcons";

type Props = {
  signatureUri: string | null;
  onGoSignature: () => void;
  canSign: boolean;
};

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function SignatureCard({
  signatureUri,
  onGoSignature,
  canSign,
}: Props) {
  const { t, i18n } = useTranslation();
  const isEmpty = !canSign;
  const buttonLabel = signatureUri ? t("home.replace") : t("home.create");
  const rawLang = String(i18n.language || "he")
    .toLowerCase()
    .split("-")[0];
  const isRtlLang = rawLang === "he" || rawLang === "ar";

  if (isEmpty) {
    return (
      <Card style={styles.signatureCard}>
        <Text style={styles.sigLabelFull}>
          {t("home.signaturePreviewTitle")}
        </Text>
        <Text style={styles.sigHint} numberOfLines={1}>
          {t("home.noSignature")}
        </Text>

        <View style={styles.emptyRow}>
          <Pressable style={styles.smallBtn} onPress={onGoSignature}>
            <Text style={styles.smallBtnText}>{buttonLabel}</Text>
          </Pressable>

          <View style={styles.sigPreviewBox}>
            <Text style={styles.sigEmptyIcon}>{ICON_SIGNATURE_EMPTY}</Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.signatureCard}>
      <View style={styles.signatureRow}>
        <Pressable style={styles.smallBtn} onPress={onGoSignature}>
          <Text style={styles.smallBtnText}>{buttonLabel}</Text>
        </Pressable>

        <View
          style={[
            styles.sigInfo,
            isRtlLang ? styles.sigInfoRtl : styles.sigInfoLtr,
          ]}
        >
          <Text
            style={[
              styles.sigLabel,
              isRtlLang ? styles.textRtl : styles.textLtr,
            ]}
          >
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
            <Text style={styles.sigEmptyIcon}>{ICON_SIGNATURE_EMPTY}</Text>
          )}
        </View>
      </View>

    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    ...theme.shadow.card,
  },
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
  sigInfoRtl: {
    alignItems: "flex-end",
    paddingRight: 2,
  },
  sigInfoLtr: {
    alignItems: "flex-start",
    paddingLeft: 2,
  },
  sigLabel: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 18,
  },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  textLtr: { textAlign: "left", writingDirection: "ltr" },
  sigLabelFull: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
  sigHint: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
});
