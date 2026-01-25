// App.tsx
import React, { useEffect, useState } from "react";
import { loadSignaturePngUri } from "./src/storage/signatureStore";
import SignPdfScreen from "./src/screens/SignPdfScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SignatureScreen from "./src/screens/SignatureScreen";
import SignImageScreen from "./src/screens/SignImageScreen";

type Screen = "home" | "signature" | "signImage" | "signPdf";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const uri = await loadSignaturePngUri();
      setSignatureUri(uri);
    })();
  }, [screen]);

  if (screen === "signature") {
    return <SignatureScreen onDone={() => setScreen("home")} />;
  }

  if (screen === "signImage") {
    return (
      <SignImageScreen
        signatureUri={signatureUri}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "signPdf") {
    return (
      <SignPdfScreen
        onBack={() => setScreen("home")}
        signatureUri={signatureUri}
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
