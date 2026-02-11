import React from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getHomeCurrentLang, HOME_LANG_FLAG } from "./homeLanguage";
import type { User } from "firebase/auth";
import { styles } from "./ProfileModal.styles";

type Props = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  isGuest: boolean;
  displayEmail: string;
  nameDraft: string;
  setNameDraft: (value: string) => void;
  onUpdateProfile: (displayName: string) => Promise<void> | void;
  onOpenLanguage: () => void;
  onOpenBilling: () => void;
  onGoAuth: () => void;
  onSignOut: () => void;
};

export default function ProfileModal({
  open,
  onClose,
  user,
  isGuest,
  displayEmail,
  nameDraft,
  setNameDraft,
  onUpdateProfile,
  onOpenLanguage,
  onOpenBilling,
  onGoAuth,
  onSignOut,
}: Props) {
  const { t } = useTranslation();
  const currentLang = getHomeCurrentLang();
  const saveDisabled = !user || !nameDraft.trim();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t("profile.title")}</Text>

          <View style={{ height: 10 }} />

          <Text style={styles.label}>{t("profile.fields.language")}</Text>
          <Pressable
            onPress={onOpenLanguage}
            style={({ pressed }) => [
              styles.langIconBtn,
              pressed ? { opacity: 0.9 } : null,
            ]}
          >
            <Text style={styles.langIconText}>
              {HOME_LANG_FLAG[currentLang]}
            </Text>
          </Pressable>

          {user ? (
            <>
              <Text style={styles.label}>{t("profile.fields.name")}</Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder={t("profile.placeholders.name")}
                style={styles.profileInput}
              />

              <Text style={styles.label}>{t("profile.fields.email")}</Text>
              <Text style={styles.profileValue}>{displayEmail}</Text>
            </>
          ) : (
            <Text style={styles.profileHint}>{t("profile.guestHint")}</Text>
          )}

          <View style={{ height: 8 }} />

          {user ? (
            <Pressable
              style={[styles.primaryBtn, saveDisabled && styles.btnDisabled]}
              disabled={saveDisabled}
              onPress={async () => {
                if (saveDisabled) return;
                await onUpdateProfile(nameDraft.trim());
                onClose();
              }}
            >
              <Text style={styles.primaryBtnText}>
                {t("profile.actions.save")}
              </Text>
            </Pressable>
          ) : null}

          {user ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                onClose();
                onOpenBilling();
              }}
            >
              <Text style={styles.secondaryBtnText}>
                {t("profile.actions.billing")}
              </Text>
            </Pressable>
          ) : null}

          {isGuest ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                onClose();
                onGoAuth();
              }}
            >
              <Text style={styles.secondaryBtnText}>
                {t("profile.actions.signIn")}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.dangerBtn}
              onPress={() => {
                onClose();
                onSignOut();
              }}
            >
              <Text style={styles.dangerBtnText}>
                {t("profile.actions.signOut")}
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
