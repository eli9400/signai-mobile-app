// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import * as Localization from "expo-localization";

// translations
import he from "./locales/he.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import ru from "./locales/ru.json";

export type AppLang = "he" | "en" | "ar" | "ru";

const STORAGE_KEY = "app_lang_v1";
const SUPPORTED: AppLang[] = ["he", "en", "ar", "ru"];

export const languageLabel: Record<AppLang, string> = {
  he: "עברית",
  en: "English",
  ar: "العربية",
  ru: "Русский",
};

function isRtlLang(lng: string) {
  const x = (lng || "").split("-")[0].toLowerCase();
  return x === "he" || x === "ar";
}

async function detectInitialLanguage(): Promise<AppLang> {
  // 1) saved language
  const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as AppLang | null;
  if (saved && SUPPORTED.includes(saved)) return saved;

  // 2) system language
  const locales = (Localization.getLocales && Localization.getLocales()) || [];
  const sys =
    (
      locales[0]?.languageCode ||
      (locales[0]?.languageTag ? locales[0].languageTag.split("-")[0] : "he")
    )?.toLowerCase() || "he";

  if (SUPPORTED.includes(sys as AppLang)) return sys as AppLang;

  // default
  return "he";
}

async function applyRtlIfNeeded(nextLang: AppLang) {
  if (Platform.OS === "web") return;

  const shouldBeRtl = isRtlLang(nextLang);
  const isCurrentlyRtl = I18nManager.isRTL;
  const isSwapEnabled =
    I18nManager.getConstants?.().doLeftAndRightSwapInRTL ??
    I18nManager.doLeftAndRightSwapInRTL;

  // Keep gestures consistent: never swap left/right in RTL (prevents drag inversion after PDF).
  if (isSwapEnabled) {
    I18nManager.swapLeftAndRightInRTL(false);
  }

  if (shouldBeRtl !== isCurrentlyRtl) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRtl);
  }
}

let _inited = false;
let _initPromise: Promise<void> | null = null;

export async function initI18n() {
  if (_inited) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const lng = await detectInitialLanguage();

    await i18n.use(initReactI18next).init({
      resources: {
        he: { translation: he },
        en: { translation: en },
        ar: { translation: ar },
        ru: { translation: ru },
      },
      lng,
      fallbackLng: "he",
      interpolation: { escapeValue: false },
      returnNull: false,
    });

    await applyRtlIfNeeded(lng);
    _inited = true;
  })();

  return _initPromise;
}

export async function setAppLanguage(lng: AppLang) {
  if (!_inited) await initI18n();

  const normalized = (lng || "he") as AppLang;
  await AsyncStorage.setItem(STORAGE_KEY, normalized);

  // changeLanguage first (text), then RTL reload if needed
  await i18n.changeLanguage(normalized);
  await applyRtlIfNeeded(normalized);
}

export default i18n;
