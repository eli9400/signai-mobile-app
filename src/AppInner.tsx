// src/AppInner.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import SignImageScreen from "./screens/SignImageScreen";
import SignPdfScreen from "./screens/SignPdfScreen";
import SignatureScreen from "./screens/SignatureScreen";
import { useAndroidBackHandler } from "./appInner/useAndroidBackHandler";
import { useAppBootstrap } from "./appInner/useAppBootstrap";
import { useAuthState } from "./appInner/useAuthState";
import { useIncomingRouting } from "./appInner/useIncomingRouting";
import { useOpenState } from "./appInner/useOpenState";
import { useSignature } from "./appInner/useSignature";
import type { Screen } from "./appInner/types";
import { AdMobService } from "./services/adMobService";
import { UserProvider } from "./contexts/UserContext";

export default function AppInner() {
  const { t } = useTranslation();
  const { i18nReady } = useAppBootstrap();

  // Initialize AdMob when app starts
  useEffect(() => {
    AdMobService.initialize();
  }, []);
  const {
    isAuthed,
    isGuest,
    setIsGuest,
    user,
    authLoading,
    authError,
    handleEmailSignIn,
    handleEmailSignUp,
    handleGoogleSignIn,
    handleSignOut,
    handleUpdateProfile,
    clearAuthError,
  } = useAuthState();

  const [screen, setScreen] = useState<Screen>("home");

  const {
    openUri,
    setOpenUri,
    openKind,
    setOpenKind,
    hasLoadedFile,
    setHasLoadedFile,
    useCamera,
    setUseCamera,
    handledIncomingRef,
    clearOpen,
  } = useOpenState();

  useIncomingRouting({
    setScreen,
    setOpenUri,
    setOpenKind,
    setHasLoadedFile,
    handledIncomingRef,
  });

  const { signatureUri, setSignatureUri, signatureScope } = useSignature({
    screen,
    user,
    isGuest,
  });

  useAndroidBackHandler({
    screen,
    hasLoadedFile,
    clearOpen,
    setScreen,
    t,
  });

  const onSignOut = async () => {
    await handleSignOut();
    setSignatureUri(null);
  };

  if (!i18nReady) return null;

  if (!isAuthed && !isGuest) {
    return (
      <AuthScreen
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onGoogleSignIn={handleGoogleSignIn}
        onClearError={clearAuthError}
        onContinueAsGuest={() => setIsGuest(true)}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Wrap authenticated/guest screens with UserProvider
  return (
    <UserProvider user={user} isGuest={isGuest}>
      {screen === "signature" && (
        <SignatureScreen
          onDone={() => setScreen("home")}
          signatureScope={signatureScope ?? { kind: "guest" }}
        />
      )}

      {screen === "signImage" && (
        <SignImageScreen
          signatureUri={signatureUri}
          initialFileUri={openKind === "image" ? openUri : null}
          onFileLoaded={() => setHasLoadedFile(true)}
          useCamera={useCamera}
          onBack={() => {
            clearOpen();
            setScreen("home");
          }}
        />
      )}

      {screen === "signPdf" && (
        <SignPdfScreen
          signatureUri={signatureUri}
          initialFileUri={openKind === "pdf" ? openUri : null}
          onFileLoaded={() => setHasLoadedFile(true)}
          onBack={() => {
            clearOpen();
            setScreen("home");
          }}
        />
      )}

      {screen === "home" && (
        <HomeScreen
          user={user}
          isGuest={isGuest}
          onSignOut={onSignOut}
          onUpdateProfile={handleUpdateProfile}
          onGoAuth={() => setIsGuest(false)}
          signatureUri={signatureUri}
          onGoSignature={() => setScreen("signature")}
          onGoSignImage={() => {
            setHasLoadedFile(false);
            setUseCamera(false);
            setScreen("signImage");
          }}
          onGoCamera={() => {
            setHasLoadedFile(false);
            setUseCamera(true);
            setScreen("signImage");
          }}
          onGoSignPdf={() => {
            setHasLoadedFile(false);
            setScreen("signPdf");
          }}
        />
      )}
    </UserProvider>
  );
}
