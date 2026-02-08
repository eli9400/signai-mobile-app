import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { languageLabel, setAppLanguage } from "../../i18n";
import { styles } from "./AuthScreen.styles";
import { getCurrentLang, LANGS, LANG_FLAG } from "./authLanguage";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AuthLanguageModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const currentLang = getCurrentLang();

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

          {LANGS.map((lng) => {
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
                  <Text style={styles.langRowIcon}>{LANG_FLAG[lng]}</Text>
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
