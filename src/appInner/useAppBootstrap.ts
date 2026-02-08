import { useEffect, useState } from "react";
import { initI18n } from "../i18n";

export function useAppBootstrap() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n()
      .catch(() => {})
      .finally(() => setI18nReady(true));
  }, []);

  return { i18nReady };
}
