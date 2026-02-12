import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ActionsRow from "./home/ActionsRow";
import HomeHeader from "./home/HomeHeader";
import HomeHero from "./home/HomeHero";
import HomeLanguageModal from "./home/HomeLanguageModal";
import ProfileModal from "./home/ProfileModal";
import SignatureCard from "./home/SignatureCard";
import BillingModal from "./home/BillingModal";
import BannerAd from "../components/BannerAd";
import { useUserContext } from "../contexts/UserContext";
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
  const { canUse, loading: userLoading, usesLeft, userData } = useUserContext();
  const canSign = Boolean(signatureUri);
  const canUseAction = userLoading ? true : canUse;
  const credits = userData?.credits ?? 0;
  const weeklyLabel =
    !userLoading && usesLeft > 0 ? t("home.usesLeft", { count: usesLeft }) : null;
  const creditsLabel =
    !userLoading && credits > 0 ? t("home.creditsLeft", { count: credits }) : null;
  const limitLabel =
    !userLoading && !canUse ? t("home.usesLimitReached") : null;
  const limitAlertShownRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    if (canUse) {
      limitAlertShownRef.current = false;
      return;
    }
    if (limitAlertShownRef.current) return;
    limitAlertShownRef.current = true;
    // Simple alert when weekly limit reached
    Alert.alert(t("home.limitTitle"), t("home.limitBody"));
  }, [canUse, userLoading, t]);

  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
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
          canUse={canUseAction}
          onGoCamera={onGoCamera}
          onGoSignImage={onGoSignImage}
          onGoSignPdf={onGoSignPdf}
        />

        {!canSign ? (
          <Text style={layoutStyles.bottomHint}>{t("home.bottomHint")}</Text>
        ) : null}

        {weeklyLabel ? (
          <Text style={layoutStyles.usageHint}>{weeklyLabel}</Text>
        ) : null}
        {creditsLabel ? (
          <Text style={layoutStyles.usageHint}>{creditsLabel}</Text>
        ) : null}
        {limitLabel ? (
          <Text style={layoutStyles.usageHint}>{limitLabel}</Text>
        ) : null}

        <View style={layoutStyles.spacerBottom} />
      </View>

      {/* Banner Ad at the bottom */}
      <BannerAd />

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
        onOpenBilling={() => setBillingOpen(true)}
        onGoAuth={onGoAuth}
        onSignOut={onSignOut}
      />

      <BillingModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        userId={user?.uid ?? null}
      />
    </SafeAreaView>
  );
}
