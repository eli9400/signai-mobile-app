import React, { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { styles } from "./SignatureScreen.styles";

type Props = {
  html: string;
  onMessage: (e: any) => void;
  onWebError: (message: string) => void;
  onWebHttpError: (code: string) => void;
  onWebTerminated: () => void;
  onDeleteSaved: () => void;
};

export default function SignatureCanvasCard({
  html,
  onMessage,
  onWebError,
  onWebHttpError,
  onWebTerminated,
  onDeleteSaved,
}: Props) {
  const { t } = useTranslation();
  const webRef = useRef<WebView>(null);
  const jsClear = "window.__sig && window.__sig.clear(); true;";
  const jsExport = "window.__sig && window.__sig.exportPng(); true;";

  return (
    <View style={styles.card}>
      <View style={styles.canvasWrap}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          androidLayerType="software"
          onError={(e) => {
            onWebError(e?.nativeEvent?.description ?? "unknown");
          }}
          onHttpError={(e) => {
            onWebHttpError(String(e?.nativeEvent?.statusCode ?? "unknown"));
          }}
          onContentProcessDidTerminate={onWebTerminated}
          style={styles.web}
        />
      </View>

      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => webRef.current?.injectJavaScript(jsClear)}
        >
          <Text style={styles.btnSecondaryText}>
            {t("signature.actions.clear")}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => webRef.current?.injectJavaScript(jsExport)}
        >
          <Text style={styles.btnPrimaryText}>
            {t("signature.actions.save")}
          </Text>
        </Pressable>
      </View>

      <Pressable style={[styles.btn, styles.btnDanger]} onPress={onDeleteSaved}>
        <Text style={styles.btnDangerText}>
          {t("signature.actions.deleteSaved")}
        </Text>
      </Pressable>
    </View>
  );
}
