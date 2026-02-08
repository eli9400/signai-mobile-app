import i18n from "../../i18n";
import { type AppLang } from "../../i18n";

export const LANGS: AppLang[] = ["he", "en", "ar", "ru"];

export const LANG_FLAG: Record<AppLang, string> = {
  he: "\u{1F1EE}\u{1F1F1}",
  en: "\u{1F1FA}\u{1F1F8}",
  ar: "\u{1F1F8}\u{1F1E6}",
  ru: "\u{1F1F7}\u{1F1FA}",
};

export const getCurrentLang = (): AppLang => {
  const raw = (i18n.language || "he").split("-")[0] as AppLang;
  return LANGS.includes(raw) ? raw : "he";
};
