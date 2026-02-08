import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ActionsRow from "./home/ActionsRow";
import HomeHeader from "./home/HomeHeader";
import HomeHero from "./home/HomeHero";
import HomeLanguageModal from "./home/HomeLanguageModal";
import ProfileModal from "./home/ProfileModal";
import SignatureCard from "./home/SignatureCard";
import { layoutStyles } from "./home/HomeLayout.styles";
import { ICON_GUEST_AVATAR } from "./home/homeIcons";
import { type HomeScreenProps } from "./home/homeTypes";

export default function HomeScreen({
  user,
  isGuest = false,
  onSignOut,
  onUpdateProfile,
  onGoAuth,
  signatureUri,
  onGoSignature,
  onGoSignImage,
  onGoSignPdf,
  onGoCamera,
}: HomeScreenProps) {
  const { t } = useTranslation();
  const canSign = Boolean(signatureUri);

  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const displayName = (user?.displayName || "").trim();
  const displayEmail = (user?.email || "").trim();
  const avatarInitial =
    displayName?.[0] ||
    displayEmail?.[0] ||
    (isGuest ? t("home.avatarGuest") : t("home.avatarInitial"));
  const avatarFallback = isGuest
    ? ICON_GUEST_AVATAR
    : String(avatarInitial).toUpperCase();
  const greetingName =
    displayName || displayEmail || (isGuest ? t("home.guestLabel") : "");

  const openProfile = () => {
    setNameDraft(displayName || "");
    setProfileOpen(true);
  };

  return (
    <SafeAreaView style={layoutStyles.safe} edges={["top", "bottom"]}>
      <View style={layoutStyles.container}>
        <HomeHeader
          greeting={t("home.greeting", { name: greetingName })}
          avatarFallback={avatarFallback}
          avatarUrl={user?.photoURL ?? null}
          onOpenProfile={openProfile}
        />

        <View style={layoutStyles.spacerTop} />

        <HomeHero />

        <SignatureCard
          signatureUri={signatureUri}
          onGoSignature={onGoSignature}
          canSign={canSign}
        />

        <ActionsRow
          canSign={canSign}
          onGoCamera={onGoCamera}
          onGoSignImage={onGoSignImage}
          onGoSignPdf={onGoSignPdf}
        />

        {!canSign ? (
          <Text style={layoutStyles.bottomHint}>{t("home.bottomHint")}</Text>
        ) : null}

        <View style={layoutStyles.spacerBottom} />
      </View>

      <HomeLanguageModal open={langOpen} onClose={() => setLangOpen(false)} />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        isGuest={isGuest}
        displayEmail={displayEmail}
        nameDraft={nameDraft}
        setNameDraft={setNameDraft}
        onUpdateProfile={onUpdateProfile}
        onOpenLanguage={() => setLangOpen(true)}
        onGoAuth={onGoAuth}
        onSignOut={onSignOut}
      />
    </SafeAreaView>
  );
}
