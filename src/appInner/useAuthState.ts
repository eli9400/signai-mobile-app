import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

WebBrowser.maybeCompleteAuthSession();

const extra =
  Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {};
const APP_SCHEME = Constants.expoConfig?.scheme ?? "quicksign";
const USE_PROXY = Constants.appOwnership === "expo";
const WEB_CLIENT_ID =
  extra.googleWebClientId ??
  "819188208664-u6dgli3anpts6656c55f3n7qtoh7kdft.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = extra.googleAndroidClientId ?? WEB_CLIENT_ID;
const EXPO_CLIENT_ID = extra.googleExpoClientId ?? WEB_CLIENT_ID;
const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: `${APP_SCHEME}:/oauthredirect`,
  useProxy: USE_PROXY,
});

export function useAuthState() {
  const { t } = useTranslation();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const googleSignInPendingRef = useRef(false);
  const googleModeRef = useRef<"signIn" | "signUp">("signIn");

  const [, googleResponse, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    expoClientId: EXPO_CLIENT_ID,
    redirectUri: REDIRECT_URI,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setIsAuthed(Boolean(nextUser));
      setUser(nextUser ?? null);
      if (nextUser) setIsGuest(false);
    });
    return () => unsub();
  }, []);

  const mapAuthError = useCallback(
    (e: any) => {
      const code = String(e?.code || e?.message || "");
      switch (code) {
        case "auth/invalid-email":
          return t("auth.errors.invalidEmail");
        case "auth/user-not-found":
          return t("auth.errors.userNotFound");
        case "auth/wrong-password":
        case "auth/invalid-credential":
          return t("auth.errors.invalidCredentials");
        case "auth/email-already-in-use":
          return t("auth.errors.emailInUse");
        case "auth/weak-password":
          return t("auth.errors.weakPassword");
        case "auth/google-not-registered":
          return t("auth.errors.googleNotRegistered");
        case "auth/google-already-registered":
          return t("auth.errors.googleAlreadyRegistered");
        default:
          return e?.message ?? t("common.errors.unknown");
      }
    },
    [t],
  );

  const handleEmailSignIn = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e: any) {
        setAuthError(mapAuthError(e));
      } finally {
        setAuthLoading(false);
      }
    },
    [mapAuthError],
  );

  const handleEmailSignUp = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          const displayName = name || email.split("@")[0] || email;
          await updateProfile(auth.currentUser, { displayName });
        }
      } catch (e: any) {
        setAuthError(mapAuthError(e));
      } finally {
        setAuthLoading(false);
      }
    },
    [mapAuthError],
  );

  useEffect(() => {
    if (!googleSignInPendingRef.current) return;
    if (!googleResponse) return;

    const run = async () => {
      try {
        if (googleResponse.type !== "success") {
          if (googleResponse.type === "error") {
            throw new Error(googleResponse.error?.message || "Google sign-in failed");
          }
          return;
        }

        const params = googleResponse.params as any;
        const authAny = (googleResponse as any).authentication;
        const idToken = params?.id_token ?? authAny?.idToken;
        const accessToken = params?.access_token ?? authAny?.accessToken;
        if (!idToken && !accessToken) {
          throw new Error("Missing Google tokens");
        }

        const credential = GoogleAuthProvider.credential(
          idToken ?? null,
          accessToken ?? null,
        );
        const result = await signInWithCredential(auth, credential);

      } catch (e: any) {
        setAuthError(mapAuthError(e));
      } finally {
        setAuthLoading(false);
        googleSignInPendingRef.current = false;
      }
    };

    run();
  }, [googleResponse, mapAuthError]);

  const handleGoogleSignIn = useCallback(async (mode: "signIn" | "signUp") => {
    setAuthError(null);
    setAuthLoading(true);
    googleModeRef.current = mode;
    googleSignInPendingRef.current = true;
    try {
      await promptAsync({ useProxy: USE_PROXY });
    } catch (e: any) {
      googleSignInPendingRef.current = false;
      setAuthError(mapAuthError(e));
      setAuthLoading(false);
    }
  }, [mapAuthError, promptAsync]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
    } finally {
      setIsGuest(false);
    }
  }, []);

  const handleUpdateProfile = useCallback(async (displayName: string) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName });
    setUser(auth.currentUser);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
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
  };
}
