import { useCallback, useEffect } from "react";
import { Alert, BackHandler, Platform } from "react-native";
import type { Screen } from "./types";

type Args = {
  screen: Screen;
  hasLoadedFile: boolean;
  clearOpen: () => void;
  setScreen: (s: Screen) => void;
  t: (key: string, options?: any) => string;
};

export function useAndroidBackHandler({
  screen,
  hasLoadedFile,
  clearOpen,
  setScreen,
  t,
}: Args) {
  const requestCloseDocumentToHome = useCallback(() => {
    if (screen !== "signPdf" && screen !== "signImage") return false;

    if (!hasLoadedFile) {
      clearOpen();
      setScreen("home");
      return true;
    }

    Alert.alert(t("common.alerts.exitTitle"), t("common.alerts.exitBody"), [
      { text: t("common.actions.cancel"), style: "cancel" },
      {
        text: t("common.actions.backToHome"),
        style: "destructive",
        onPress: () => {
          clearOpen();
          setScreen("home");
        },
      },
    ]);

    return true;
  }, [clearOpen, hasLoadedFile, screen, setScreen, t]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      if (screen === "signPdf" || screen === "signImage") {
        return requestCloseDocumentToHome();
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [hasLoadedFile, requestCloseDocumentToHome, screen]);
}
