import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthEmailIcon, AuthGoogleIcon, AuthGuestIcon } from "../../ui/icons";
import { theme } from "../../ui/theme";
import { styles } from "./AuthScreen.styles";
import { type AuthScreenProps } from "./authTypes";

type Tab = "signIn" | "signUp";
const LEGAL_CONSENT_KEY = "legal_consent_v1";

export default function AuthFormCard({
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn,
  onContinueAsGuest,
  onClearError,
  loading = false,
  error,
}: AuthScreenProps) {
  const { t } = useTranslation();
  const extra =
    Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {};
  const termsUrl = typeof extra.termsUrl === "string" ? extra.termsUrl : "";
  const privacyUrl =
    typeof extra.privacyUrl === "string" ? extra.privacyUrl : "";
  const [tab, setTab] = useState<Tab>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadConsent = async () => {
      try {
        const saved = await AsyncStorage.getItem(LEGAL_CONSENT_KEY);
        if (mounted && saved === "1") {
          setAcceptedLegal(true);
        }
      } catch {
        // Ignore storage failures and keep local default.
      }
    };
    void loadConsent();
    return () => {
      mounted = false;
    };
  }, []);

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const clearErrors = () => {
    setShowErrors(false);
    setLegalError(null);
    onClearError?.();
  };

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    clearForm();
    clearErrors();
  };

  const formTitle =
    tab === "signIn" ? t("auth.tabs.signIn") : t("auth.tabs.signUp");

  const validate = () => {
    if (tab === "signUp" && !name.trim()) return t("auth.errors.missingName");
    if (!email.trim()) return t("auth.errors.missingEmail");
    if (!password.trim()) return t("auth.errors.missingPassword");
    if (password.length < 6) return t("auth.errors.passwordTooShort");
    if (tab === "signUp" && password !== confirm)
      return t("auth.errors.passwordsDontMatch");
    return null;
  };

  const validationError = validate();

  const enforceLegalConsent = () => {
    if (acceptedLegal) return true;
    setLegalError(t("auth.errors.mustAcceptLegal"));
    return false;
  };

  const openLegalUrl = async (url: string) => {
    if (!url) {
      Alert.alert(t("common.alerts.errorTitle"), t("auth.errors.legalUrlMissing"));
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(
          t("common.alerts.errorTitle"),
          t("auth.errors.legalUrlMissing"),
        );
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("common.alerts.errorTitle"), t("auth.errors.legalUrlMissing"));
    }
  };

  const submit = async () => {
    setShowErrors(true);
    if (validationError) return;
    if (!enforceLegalConsent()) return;
    setLegalError(null);

    if (tab === "signIn") {
      await onEmailSignIn(email.trim(), password);
    } else {
      await onEmailSignUp(name.trim(), email.trim(), password);
    }
  };

  const handleGooglePress = async () => {
    setShowErrors(true);
    if (!enforceLegalConsent()) return;
    setLegalError(null);
    await onGoogleSignIn(tab);
  };

  const handleGuestPress = () => {
    setShowErrors(true);
    if (!enforceLegalConsent()) return;
    setLegalError(null);
    onContinueAsGuest();
  };

  const toggleLegalConsent = () => {
    setAcceptedLegal((prev) => {
      const next = !prev;
      if (next) {
        void AsyncStorage.setItem(LEGAL_CONSENT_KEY, "1");
      } else {
        void AsyncStorage.removeItem(LEGAL_CONSENT_KEY);
      }
      return next;
    });
    setLegalError(null);
    onClearError?.();
  };

  return (
    <>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => switchTab("signIn")}
          style={[styles.tabBtn, tab === "signIn" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              tab === "signIn" && styles.tabTextActive,
            ]}
          >
            {t("auth.tabs.signIn")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => switchTab("signUp")}
          style={[styles.tabBtn, tab === "signUp" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              tab === "signUp" && styles.tabTextActive,
            ]}
          >
            {t("auth.tabs.signUp")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.formTitle}>{formTitle}</Text>

        {tab === "signUp" ? (
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              onClearError?.();
            }}
            onBlur={() => setShowErrors(true)}
            placeholder={t("auth.fields.name")}
            style={styles.input}
          />
        ) : null}

        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            onClearError?.();
          }}
          onBlur={() => setShowErrors(true)}
          placeholder={t("auth.fields.email")}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            onClearError?.();
          }}
          onBlur={() => setShowErrors(true)}
          placeholder={t("auth.fields.password")}
          secureTextEntry
          style={styles.input}
        />

        {tab === "signUp" ? (
          <TextInput
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              onClearError?.();
            }}
            onBlur={() => setShowErrors(true)}
            placeholder={t("auth.fields.confirmPassword")}
            secureTextEntry
            style={styles.input}
          />
        ) : null}

        <View style={styles.legalRow}>
          <Pressable
            style={[
              styles.legalCheckbox,
              acceptedLegal && styles.legalCheckboxChecked,
            ]}
            onPress={toggleLegalConsent}
          >
            {acceptedLegal ? (
              <Text style={styles.legalCheckboxMark}>{"\u2713"}</Text>
            ) : null}
          </Pressable>
          <Text style={styles.legalText}>
            {t("auth.legal.prefix")}{" "}
            <Text
              style={styles.legalLink}
              onPress={() => {
                void openLegalUrl(termsUrl);
              }}
            >
              {t("auth.legal.terms")}
            </Text>{" "}
            {t("auth.legal.and")}{" "}
            <Text
              style={styles.legalLink}
              onPress={() => {
                void openLegalUrl(privacyUrl);
              }}
            >
              {t("auth.legal.privacy")}
            </Text>
          </Text>
        </View>

        {((showErrors && validationError) || legalError || error) ? (
          <Text style={styles.errorText}>
            {(showErrors && validationError) || legalError || error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          disabled={loading}
          onPress={submit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnRow}>
              <AuthEmailIcon size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>
                {tab === "signIn"
                  ? t("auth.actions.signIn")
                  : t("auth.actions.signUp")}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>{t("auth.or")}</Text>
          <View style={styles.orLine} />
        </View>

        <Pressable
          style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
          disabled={loading}
          onPress={() => {
            void handleGooglePress();
          }}
        >
          <AuthGoogleIcon size={28} />
        </Pressable>

        <Pressable style={styles.guestBtn} onPress={handleGuestPress}>
          <View style={styles.btnRow}>
            <AuthGuestIcon size={18} color={theme.colors.brand} />
            <Text style={styles.guestBtnText}>
              {t("auth.actions.continueAsGuest")}
            </Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}
