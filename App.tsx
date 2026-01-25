// App.tsx
import React, { useEffect, useState } from "react";
import { I18nManager, Platform } from "react-native";
import * as Linking from "expo-linking";

import { loadSignaturePngUri } from "./src/storage/signatureStore";
import SignPdfScreen from "./src/screens/SignPdfScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SignatureScreen from "./src/screens/SignatureScreen";
import SignImageScreen from "./src/screens/SignImageScreen";
import { useShareIntentContext } from "expo-share-intent";

type Screen = "home" | "signature" | "signImage" | "signPdf";
type OpenKind = "pdf" | "image";

function detectKindFromUri(uri: string): OpenKind {
  const clean = uri.split("?")[0].toLowerCase();

  // PDFs (either by extension or by hint in the uri)
  if (clean.endsWith(".pdf") || clean.includes("pdf")) return "pdf";

  // Images (common extensions)
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

  // IMPORTANT: for content:// without extension, default to PDF (more common for "open with")
  return "pdf";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  // incoming file from "Open with"
  const [openUri, setOpenUri] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<OpenKind | null>(null);

  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  useEffect(() => {
    // You already saw RTL can flip gestures in builds; keep it safe:
    if (Platform.OS === "android" && I18nManager.isRTL) {
      I18nManager.allowRTL(false);
      I18nManager.forceRTL(false);
    }
  }, []);

  useEffect(() => {
    if (!hasShareIntent) return;

    const files = shareIntent?.files ?? [];
    const first = files[0];

    if (!first?.path) {
      // Nothing useful came in
      resetShareIntent();
      return;
    }

    const uri = first.path; // usually content://... or file://...
    const mime = (first.mimeType ?? "").toLowerCase();

    console.log("📥 share/open intent:", {
      uri,
      mime,
      filesCount: files.length,
    });

    if (mime === "application/pdf") {
      setOpenUri(uri);
      setOpenKind("pdf");
      setScreen("signPdf");
    } else if (mime.startsWith("image/")) {
      setOpenUri(uri);
      setOpenKind("image");
      setScreen("signImage");
    } else {
      // fallback: try by uri string
      const kind = detectKindFromUri(uri);
      setOpenUri(uri);
      setOpenKind(kind);
      setScreen(kind === "pdf" ? "signPdf" : "signImage");
    }

    // IMPORTANT: after we handled it, clear the intent so it won't re-trigger
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  useEffect(() => {
    (async () => {
      const uri = await loadSignaturePngUri();
      setSignatureUri(uri);
    })();
  }, [screen]);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (!url) return;

      // In Android "VIEW" intents, this is often file:// or content://
      const decoded = decodeURI(url);
      const kind = detectKindFromUri(decoded);

      setOpenUri(decoded);
      setOpenKind(kind);

      if (kind === "pdf") setScreen("signPdf");
      else setScreen("signImage");
    };

    // cold start
    Linking.getInitialURL().then((initialUrl) => {
      console.log("🔗 initialUrl:", initialUrl);
      if (initialUrl) handleUrl(initialUrl);
    });

    // warm start (app already open)
    const sub = Linking.addEventListener("url", ({ url }: { url: string }) => {
      console.log("🔗 url event:", url);
      handleUrl(url);
    });
  }, []);

  const clearOpen = () => {
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
        onBack={() => {
          clearOpen();
          setScreen("home");
        }}
        // pass-through (will be used in next step inside SignImageScreen)
        {...({ initialFileUri: openKind === "image" ? openUri : null } as any)}
      />
    );
  }

  if (screen === "signPdf") {
    return (
      <SignPdfScreen
        onBack={() => {
          clearOpen();
          setScreen("home");
        }}
        signatureUri={signatureUri}
        // pass-through (will be used in next step inside SignPdfScreen)
        {...({ initialFileUri: openKind === "pdf" ? openUri : null } as any)}
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
