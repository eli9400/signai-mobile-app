// src/AppInner.tsx
import React, { useEffect, useRef, useState } from "react";
import { I18nManager, Platform, BackHandler, Alert } from "react-native";
import * as Linking from "expo-linking";
import { useShareIntentContext } from "expo-share-intent";
import { loadSignaturePngUri } from "./storage/signatureStore";
import SignPdfScreen from "./screens/SignPdfScreen";
import HomeScreen from "./screens/HomeScreen";
import SignatureScreen from "./screens/SignatureScreen";
import SignImageScreen from "./screens/SignImageScreen";

// NEW: cache incoming content:// to a local file:// we control
import {
  cacheIncomingUri,
  IncomingFilePermissionError,
} from "./utils/incomingFile";

type Screen = "home" | "signature" | "signImage" | "signPdf";
type OpenKind = "pdf" | "image";

function detectKindFromUri(uri: string): OpenKind {
  const clean = uri.split("?")[0].toLowerCase();

  // PDFs
  if (clean.endsWith(".pdf") || clean.includes("pdf")) return "pdf";

  // Images
  if (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".heic") ||
    clean.endsWith(".gif")
  ) {
    return "image";
  }

  // content:// without extension -> default pdf (common for open-with)
  return "pdf";
}

export default function AppInner() {
  const [screen, setScreen] = useState<Screen>("home");
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  // incoming file (Open with / Share)
  const [openUri, setOpenUri] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<OpenKind | null>(null);

  // camera mode for SignImageScreen
  const [useCamera, setUseCamera] = useState(false);

  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  const [hasLoadedFile, setHasLoadedFile] = useState(false);

  // prevent Linking fallback from overriding a share we already handled
  const handledIncomingRef = useRef(false);

  useEffect(() => {
    // RTL in Android builds can flip gestures; keep it safe.
    if (Platform.OS === "android" && I18nManager.isRTL) {
      I18nManager.allowRTL(false);
      I18nManager.forceRTL(false);
    }
  }, []);

  // Load saved signature when returning between screens
  useEffect(() => {
    (async () => {
      const uri = await loadSignaturePngUri();
      setSignatureUri(uri);
    })();
  }, [screen]);

  const requestCloseDocumentToHome = () => {
    // אם אנחנו לא בתוך מסך מסמך – חזרה רגילה
    if (screen !== "signPdf" && screen !== "signImage") {
      return false;
    }

    // אם עוד לא נטען קובץ – חזרה שקטה לבית
    if (!hasLoadedFile) {
      clearOpen();
      setScreen("home");
      return true;
    }

    // אם יש קובץ – דיאלוג אישור
    Alert.alert("יציאה מהמסמך", "האם לחזור למסך הראשי?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "חזרה למסך הראשי",
        style: "destructive",
        onPress: () => {
          clearOpen();
          setScreen("home");
        },
      },
    ]);

    return true; // חסימה של יציאה מהאפליקציה
  };

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      // במסכי מסמך: ננהל חזרה דרך הפונקציה המרכזית (כולל דיאלוג)
      if (screen === "signPdf" || screen === "signImage") {
        return requestCloseDocumentToHome();
      }

      // במסך הבית – Back רגיל (יציאה)
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [screen, hasLoadedFile]);

  const routeIncoming = (uri: string, kind?: OpenKind, mime?: string) => {
    const decoded = decodeURI(uri);
    const finalKind: OpenKind =
      kind ??
      (mime === "application/pdf"
        ? "pdf"
        : mime?.startsWith("image/")
          ? "image"
          : detectKindFromUri(decoded));

    handledIncomingRef.current = true;

    setOpenUri(decoded);
    setOpenKind(finalKind);
    setHasLoadedFile(true);
    setScreen(finalKind === "pdf" ? "signPdf" : "signImage");
  };

  // NEW: prepare incoming URI (copy content:// to local file://)
  const prepareAndRouteIncoming = async (
    uri: string,
    kind?: OpenKind,
    mime?: string,
    source?: "shareIntent" | "linking",
    fileNameHint?: string,
  ) => {
    const decoded = decodeURI(uri);
    const finalKind: OpenKind =
      kind ??
      (mime === "application/pdf"
        ? "pdf"
        : mime?.startsWith("image/")
          ? "image"
          : detectKindFromUri(decoded));

    console.log(`📋 ${source ?? "incoming"}: copying to cache...`, decoded);

    try {
      const localUri = await cacheIncomingUri(decoded, mime, fileNameHint);

      console.log(`✅ ${source ?? "incoming"}: cached local:`, localUri);
      routeIncoming(localUri, finalKind, mime);
    } catch (e: any) {
      const msg = String(e?.message || e);

      if (e instanceof IncomingFilePermissionError) {
        console.log(
          `⛔ ${source ?? "incoming"}: NO PERMISSION to read content:// (picker fallback needed):`,
          msg,
        );
      } else {
        console.log(
          `⚠️ ${source ?? "incoming"}: cache failed, trying original URI:`,
          msg,
        );
      }

      routeIncoming(decoded, finalKind, mime);
    }
  };

  // 1) ShareIntent (from other apps)
  useEffect(() => {
    if (!hasShareIntent) return;

    // חשוב: נדפיס את כל האובייקט כדי להבין מה מגיע בפועל
    try {
      console.log("📥 shareIntent raw:", JSON.stringify(shareIntent, null, 2));
    } catch {
      console.log("📥 shareIntent raw (non-serializable):", shareIntent);
    }

    const files = (shareIntent as any)?.files ?? [];
    const first = files[0];

    // expo-share-intent לא תמיד משתמש ב-path, לפעמים זה uri/fileUri/contentUri
    const uri: string | null =
      first?.path ?? first?.uri ?? first?.fileUri ?? first?.contentUri ?? null;

    const mime: string = String(
      first?.mimeType ?? first?.mime ?? (shareIntent as any)?.mimeType ?? "",
    ).toLowerCase();

    console.log("📥 share/open parsed:", {
      uri,
      mime,
      filesCount: files.length,
    });

    if (!uri) {
      // אין לנו קובץ -> נשארים במסך הבית
      return;
    }

    // Determine kind
    const kind: OpenKind =
      mime === "application/pdf"
        ? "pdf"
        : mime?.startsWith("image/")
          ? "image"
          : detectKindFromUri(uri);

    // NEW: cache first, then navigate
    prepareAndRouteIncoming(uri, kind, mime, "shareIntent", first?.fileName);

    // קריטי: לא עושים reset מיד. נעשה reset רק אחרי שהמסך כבר עלה.
    // אחרת לפעמים ה-URI נהיה לא קריא במסך הבא.
    setTimeout(() => {
      try {
        resetShareIntent();
      } catch {}
    }, 2000);
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  // 2) Fallback: Linking (VIEW intents sometimes come as URL)
  useEffect(() => {
    const handleUrl = (url: string) => {
      if (!url) return;

      // If we've already handled a share/open payload, don't override it.
      if (handledIncomingRef.current) return;

      console.log("🔗 handleUrl:", url);

      // NEW: cache first, then navigate
      prepareAndRouteIncoming(url, undefined, undefined, "linking");
    };

    // cold start
    Linking.getInitialURL().then((initialUrl: string | null) => {
      console.log("🔗 initialUrl:", initialUrl);
      if (initialUrl) handleUrl(initialUrl);
    });

    // warm start
    const sub = Linking.addEventListener("url", ({ url }: { url: string }) => {
      console.log("🔗 url event:", url);
      handleUrl(url);
    });

    return () => {
      // @ts-ignore older RN types
      sub?.remove?.();
    };
  }, []);

  const clearOpen = () => {
    handledIncomingRef.current = false;
    setOpenUri(null);
    setOpenKind(null);
    setHasLoadedFile(false);
    setUseCamera(false);
  };

  if (screen === "signature") {
    return <SignatureScreen onDone={() => setScreen("home")} />;
  }

  if (screen === "signImage") {
    return (
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
    );
  }

  if (screen === "signPdf") {
    return (
      <SignPdfScreen
        signatureUri={signatureUri}
        initialFileUri={openKind === "pdf" ? openUri : null}
        onFileLoaded={() => setHasLoadedFile(true)}
        onBack={() => {
          clearOpen();
          setScreen("home");
        }}
      />
    );
  }

  return (
    <HomeScreen
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
  );
}
