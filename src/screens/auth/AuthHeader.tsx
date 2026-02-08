import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { styles } from "./AuthScreen.styles";
import { getCurrentLang, LANG_FLAG } from "./authLanguage";

type Props = {
  onOpenLanguage: () => void;
};

export default function AuthHeader({ onOpenLanguage }: Props) {
  const { t } = useTranslation();
  const currentLang = getCurrentLang();

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onOpenLanguage}
          style={({ pressed }) => [
            styles.langIconBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.langIconText}>{LANG_FLAG[currentLang]}</Text>
        </Pressable>
      </View>

      <Text style={styles.appTitle}>{t("auth.title")}</Text>
    </View>
  );
}
