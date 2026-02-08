import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { languageLabel, setAppLanguage } from "../../i18n";
import { theme } from "../../ui/theme";
import { getHomeCurrentLang, HOME_LANGS, HOME_LANG_FLAG } from "./homeLanguage";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function HomeLanguageModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const currentLang = getHomeCurrentLang();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.langBackdrop} onPress={onClose}>
        <Pressable style={styles.langCard} onPress={() => {}}>
          <Text style={styles.langTitle}>{t("home.language")}</Text>

          <View style={{ height: 10 }} />

          {HOME_LANGS.map((lng) => {
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
                  onClose();
                  await setAppLanguage(lng);
                }}
              >
                <View style={styles.langRowLeft}>
                  <Text style={styles.langRowIcon}>{HOME_LANG_FLAG[lng]}</Text>
                  <Text style={styles.langRowText}>{languageLabel[lng]}</Text>
                </View>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  langRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  langRowIcon: { fontSize: 18 },
  langRowText: {
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
});
