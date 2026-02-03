import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import i18n from "../../i18n";

type Status = "idle" | "picking" | "reading" | "ready" | "error";

type LoadedPdf = {
  uri: string;
  name: string;
  base64: string; // WITHOUT prefix
};

async function readPdfBase64(uri: string) {
  return FileSystem.readAsStringAsync(uri, {
    encoding: "base64" as any,
  });
}

async function copyToCacheIfNeeded(uri: string, name: string) {
  // Helps with content:// URIs
  try {
    const dest = `${FileSystem.cacheDirectory}pdf_${Date.now()}_${name}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri; // fallback
  }
}

export function usePdfDocument() {
  const [status, setStatus] = useState<Status>("idle");
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);

  const pickPdf = useCallback(async () => {
    try {
      setStatus("picking");

      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) {
        setStatus("idle");
        return null;
      }

      const asset = res.assets?.[0];
      if (!asset?.uri) {
        setStatus("error");
        return null;
      }

      const name = asset.name ?? "document.pdf";
      const safeUri = await copyToCacheIfNeeded(asset.uri, name);

      setStatus("reading");
      const base64 = await readPdfBase64(safeUri);

      const loaded: LoadedPdf = { uri: safeUri, name, base64 };
      setPdf(loaded);
      setStatus("ready");
      return loaded;
    } catch (e: any) {
      setStatus("error");
      Alert.alert(
        i18n.t("common.alerts.errorTitle"),
        e?.message ?? i18n.t("signPdf.errors.pickFailed"),
      );
      return null;
    }
  }, []);

  const openPdfFromUri = useCallback(async (uri: string, name?: string) => {
    try {
      const finalName =
        name ?? uri.split("/").pop()?.split("?")[0] ?? "document.pdf";

      setStatus("reading");
      const safeUri = await copyToCacheIfNeeded(uri, finalName);
      const base64 = await readPdfBase64(safeUri);

      setPdf({ uri: safeUri, name: finalName, base64 });
      setStatus("ready");
      return true;
    } catch (e: any) {
      setStatus("error");
      Alert.alert(
        i18n.t("common.alerts.errorTitle"),
        e?.message ?? i18n.t("signPdf.errors.openFailed"),
      );
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setPdf(null);
    setStatus("idle");
  }, []);

  const isBusy = status === "picking" || status === "reading";

  return {
    status,
    isBusy,
    pdf, // {uri,name,base64} | null

    pickPdf,
    openPdfFromUri,
    reset,
  };
}
