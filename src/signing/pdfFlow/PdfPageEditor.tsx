// src/signing/pdfFlow/PdfPageEditor.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { theme } from "../../ui/theme";
import PdfPageToPngWebView from "../pdf/PdfPageToPngWebView";
import { BackIconButton } from "../../ui/icons";

type Props = {
  title: string;
  onBackToGrid: () => void;
  pdfBase64: string | null;
  pageNumber: number;
};

export default function PdfPageEditor({
  title,
  onBackToGrid,
  pdfBase64,
  pageNumber,
}: Props) {
  const [isRendering, setIsRendering] = useState(true);

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <BackIconButton onPress={onBackToGrid} />
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.pageWrap}>
        {!pdfBase64 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>אין PDF טעון</Text>
          </View>
        ) : (
          <>
            <PdfPageToPngWebView
              pdfBase64={pdfBase64}
              pageNumber={pageNumber}
              onRendered={() => setIsRendering(false)}
              onError={() => setIsRendering(false)}
            />

            {isRendering ? (
              <View style={styles.overlay}>
                <View style={styles.overlayBox}>
                  <ActivityIndicator />
                  <Text style={styles.overlayText}>מרנדר עמוד…</Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* שלב 4+: כאן ייכנסו כפתורי הוספת חתימה/טקסט + זום/פאן + overlays */}
      <View style={styles.bottomHint}>
        <Text style={styles.bottomHintText}>
          בשלב הבא נוסיף: הוסף חתימה • הוסף טקסט • זום עם שתי אצבעות
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg, paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 10,
  },
  topTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
    fontSize: 18,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  iconBtnText: { fontSize: 18, fontWeight: "900" },

  pageWrap: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadow.card,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: theme.colors.textSecondary, fontWeight: "800" },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  overlayBox: {
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    ...theme.shadow.card,
  },
  overlayText: { fontWeight: "900", color: theme.colors.textPrimary },

  bottomHint: { paddingVertical: 12, alignItems: "center" },
  bottomHintText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    textAlign: "center",
  },
});
