import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthFormCard from "./auth/AuthFormCard";
import AuthHeader from "./auth/AuthHeader";
import AuthLanguageModal from "./auth/AuthLanguageModal";
import { styles } from "./auth/AuthScreen.styles";
import { type AuthScreenProps } from "./auth/authTypes";

export default function AuthScreen(props: AuthScreenProps) {
  const [langOpen, setLangOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AuthHeader onOpenLanguage={() => setLangOpen(true)} />
        <AuthFormCard {...props} />
      </KeyboardAvoidingView>

      <AuthLanguageModal open={langOpen} onClose={() => setLangOpen(false)} />
    </SafeAreaView>
  );
}
