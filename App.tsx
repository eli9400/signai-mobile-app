// App.tsx
import React, { useEffect, useRef, useState } from "react";
import { I18nManager, Platform } from "react-native";
import * as Linking from "expo-linking";
import { useShareIntentContext } from "expo-share-intent";

import { loadSignaturePngUri } from "./src/storage/signatureStore";
import SignPdfScreen from "./src/screens/SignPdfScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SignatureScreen from "./src/screens/SignatureScreen";
import SignImageScreen from "./src/screens/SignImageScreen";

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

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  // incoming file (Open with / Share)
  const [openUri, setOpenUri] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<OpenKind | null>(null);

  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

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
    setScreen(finalKind === "pdf" ? "signPdf" : "signImage");
  };

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

    // ננווט לפי mime, ואם אין mime ניפול לזיהוי לפי URI
    if (mime === "application/pdf") {
      setOpenUri(uri);
      setOpenKind("pdf");
      setScreen("signPdf");
    } else if (mime.startsWith("image/")) {
      setOpenUri(uri);
      setOpenKind("image");
      setScreen("signImage");
    } else {
      const kind = detectKindFromUri(uri);
      setOpenUri(uri);
      setOpenKind(kind);
      setScreen(kind === "pdf" ? "signPdf" : "signImage");
    }

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
      routeIncoming(url);
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
  };

  if (screen === "signature") {
    return <SignatureScreen onDone={() => setScreen("home")} />;
  }

  if (screen === "signImage") {
    return (
      <SignImageScreen
        signatureUri={signatureUri}
        initialFileUri={openKind === "image" ? openUri : null}
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
      onGoSignImage={() => setScreen("signImage")}
      onGoSignPdf={() => setScreen("signPdf")}
    />
  );
}
