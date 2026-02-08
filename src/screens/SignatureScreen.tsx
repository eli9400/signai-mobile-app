import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { clearSignature, saveSignaturePng } from "../storage/signatureStore";
import SignatureCanvasCard from "./signature/SignatureCanvasCard";
import SignatureHeader from "./signature/SignatureHeader";
import SignatureHero from "./signature/SignatureHero";
import { styles } from "./signature/SignatureScreen.styles";
import { buildSignatureHtml } from "./signature/signatureHtml";
import { type SignatureScreenProps } from "./signature/signatureTypes";

export default function SignatureScreen({
  onDone,
  signatureScope,
}: SignatureScreenProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(t("signature.status.drawHint"));

  const html = useMemo(() => {
    const title = t("signature.canvas.title");
    const tip = t("signature.canvas.tip");
    return buildSignatureHtml(title, tip);
  }, [t]);

  const onMessage = async (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === "empty") {
        setStatus(t("signature.status.empty"));
        return;
      }

      if (msg.type === "png") {
        setStatus(t("signature.status.saving"));
        await saveSignaturePng(msg.b64, signatureScope);
        setStatus(t("signature.status.saved"));
        onDone();
        return;
      }
    } catch {
      setStatus(t("signature.status.canvasError"));
    }
  };

  const handleDeleteSaved = async () => {
    await clearSignature(signatureScope);
    onDone();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <SignatureHeader title={t("signature.title")} onClose={onDone} />
        <SignatureHero title={t("signature.heroTitle")} status={status} />

        <SignatureCanvasCard
          html={html}
          onMessage={onMessage}
          onWebError={(message) => {
            setStatus(
              t("signature.status.webviewError", {
                message,
              }),
            );
          }}
          onWebHttpError={(code) => {
            setStatus(
              t("signature.status.webviewHttpError", {
                code,
              }),
            );
          }}
          onWebTerminated={() => {
            setStatus(t("signature.status.webviewTerminated"));
          }}
          onDeleteSaved={handleDeleteSaved}
        />

        <View style={styles.spacerBottom} />
      </View>
    </SafeAreaView>
  );
}
