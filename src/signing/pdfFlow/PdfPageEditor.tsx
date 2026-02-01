import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";

import PdfPageToPngWebView from "../pdf/PdfPageToPngWebView";
import OverlayStage from "../overlays/OverlayStage";
import { BackIconButton } from "../../ui/icons";

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

type Props = {
  title: string;
  onBackToGrid: () => void;
  onClose: () => void;
  pdfBase64: string | null;
  pageNumber: number;
  signatureUri?: string | null;
};

export default function PdfPageEditor({
  title,
  onBackToGrid,
  onClose,
  pdfBase64,
  pageNumber,
  signatureUri = null,
}: Props) {
  const [isRendering, setIsRendering] = useState(true);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [pngSize, setPngSize] = useState<{ w: number; h: number } | null>(null);

  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [name1Pos, setName1Pos] = useState({ x: 20, y: 140 });
  const [name2Pos, setName2Pos] = useState({ x: 20, y: 210 });
  const [name1Font, setName1Font] = useState(28);
  const [name2Font, setName2Font] = useState(28);
  const [sigPos, setSigPos] = useState({ x: 20, y: 20 });
  const [sigSize, setSigSize] = useState({ w: 180, h: 90 });

  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addTextValue, setAddTextValue] = useState("");

  const [pageScale, setPageScale] = useState(1);
  const [pageTx, setPageTx] = useState(0);
  const [pageTy, setPageTy] = useState(0);

  const canShowStage = Boolean(pngDataUrl && pngSize);
  const nextTextTarget = !name1.trim()
    ? "name1"
    : !name2.trim()
      ? "name2"
      : null;

  const pinchRef = useRef<{
    isPinching: boolean;
    startDist: number;
    startScale: number;
  }>({
    isPinching: false,
    startDist: 0,
    startScale: 1,
  });

  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  const isOverlayInteractingRef = useRef(false);

  useEffect(() => {
    setIsRendering(true);
    setPngDataUrl(null);
    setPngSize(null);
  }, [pageNumber, pdfBase64]);

  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));

  const resetZoom = () => {
    setPageScale(1);
    setPageTx(0);
    setPageTy(0);
    pinchRef.current.isPinching = false;
    panRef.current.isPanning = false;
  };

  const openAddText = () => {
    if (!nextTextTarget) return;
    setAddTextValue("");
    setAddTextOpen(true);
  };

  const confirmAddText = () => {
    const t = (addTextValue ?? "").trim();
    if (!t || !nextTextTarget) {
      setAddTextOpen(false);
      return;
    }

    if (nextTextTarget === "name1") {
      setName1(t);
      setName1Pos({ x: 24, y: 160 });
      setName1Font(30);
    } else {
      setName2(t);
      setName2Pos({ x: 24, y: 240 });
      setName2Font(30);
    }

    setAddTextOpen(false);
  };

  const onStageStart = (evt: any) => {
    if (isOverlayInteractingRef.current) return;

    const touches = evt.nativeEvent.touches ?? [];

    if (touches.length >= 2) {
      const a = { x: touches[0].pageX, y: touches[0].pageY };
      const b = { x: touches[1].pageX, y: touches[1].pageY };
      pinchRef.current = {
        isPinching: true,
        startDist: dist(a, b),
        startScale: pageScale,
      };
      panRef.current.isPanning = false;
      return;
    }

    if (touches.length === 1 && pageScale > 1.02) {
      const { pageX, pageY } = evt.nativeEvent;
      panRef.current = {
        isPanning: true,
        startX: pageX,
        startY: pageY,
        startTx: pageTx,
        startTy: pageTy,
      };
      pinchRef.current.isPinching = false;
    }
  };

  const onStageMove = (evt: any) => {
    if (isOverlayInteractingRef.current) return;

    const touches = evt.nativeEvent.touches ?? [];

    if (touches.length >= 2) {
      if (!pinchRef.current.isPinching) {
        const a = { x: touches[0].pageX, y: touches[0].pageY };
        const b = { x: touches[1].pageX, y: touches[1].pageY };
        pinchRef.current = {
          isPinching: true,
          startDist: dist(a, b),
          startScale: pageScale,
        };
        panRef.current.isPanning = false;
        return;
      }

      const a = { x: touches[0].pageX, y: touches[0].pageY };
      const b = { x: touches[1].pageX, y: touches[1].pageY };
      const d = dist(a, b);

      const base = pinchRef.current.startDist || 1;
      const ratio = d / base;

      const nextScale = clamp(pinchRef.current.startScale * ratio, 1, 3);
      setPageScale(nextScale);

      if (nextScale <= 1.02) {
        setPageTx(0);
        setPageTy(0);
      }
      return;
    }

    if (touches.length === 1 && pageScale > 1.02) {
      if (!panRef.current.isPanning) {
        const { pageX, pageY } = evt.nativeEvent;
        panRef.current = {
          isPanning: true,
          startX: pageX,
          startY: pageY,
          startTx: pageTx,
          startTy: pageTy,
        };
        return;
      }

      const { pageX, pageY } = evt.nativeEvent;
      const dx = pageX - panRef.current.startX;
      const dy = pageY - panRef.current.startY;

      setPageTx(panRef.current.startTx + dx);
      setPageTy(panRef.current.startTy + dy);
    }
  };

  const onStageEnd = () => {
    pinchRef.current.isPinching = false;
    panRef.current.isPanning = false;

    if (pageScale <= 1.02) resetZoom();
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <BackIconButton onPress={onBackToGrid} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.stageWrap}>
        {canShowStage ? (
          <View
            style={styles.stageResponder}
            onStartShouldSetResponder={() => !isOverlayInteractingRef.current}
            onMoveShouldSetResponder={() => !isOverlayInteractingRef.current}
            onResponderGrant={onStageStart}
            onResponderMove={onStageMove}
            onResponderRelease={onStageEnd}
            onResponderTerminate={onStageEnd}
          >
            <View
              style={[
                styles.stageTransform,
                {
                  transform: [
                    { translateX: pageTx },
                    { translateY: pageTy },
                    { scale: pageScale },
                  ],
                },
              ]}
              pointerEvents="box-none"
            >
              <OverlayStage
                imageUri={pngDataUrl!}
                imageSize={pngSize!}
                signatureUri={signatureUri ?? null}
                sigPos={sigPos}
                setSigPos={setSigPos}
                sigSize={sigSize}
                setSigSize={setSigSize}
                name1={name1}
                setName1={setName1}
                name1Pos={name1Pos}
                setName1Pos={setName1Pos}
                name1Font={name1Font}
                setName1Font={setName1Font}
                name2={name2}
                setName2={setName2}
                name2Pos={name2Pos}
                setName2Pos={setName2Pos}
                name2Font={name2Font}
                setName2Font={setName2Font}
                pageScale={pageScale}
                onInteractionStart={() => {
                  isOverlayInteractingRef.current = true;
                }}
                onInteractionEnd={() => {
                  isOverlayInteractingRef.current = false;
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.75, fontWeight: "800", color: "white" }}>
              מכין תצוגת עמוד…
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionBtn,
            !nextTextTarget && styles.actionBtnDisabled,
          ]}
          onPress={openAddText}
          disabled={!nextTextTarget}
        >
          <Text style={styles.actionText}>
            {nextTextTarget ? "הוסף טקסט" : "כבר יש 2 טקסטים"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={resetZoom}>
          <Text style={styles.secondaryText}>איפוס זום</Text>
        </Pressable>
      </View>

      <Modal
        visible={addTextOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddTextOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>הוסף טקסט</Text>
            <TextInput
              value={addTextValue}
              onChangeText={setAddTextValue}
              placeholder="הקלד טקסט…"
              placeholderTextColor="#777"
              autoFocus
              multiline
              style={styles.modalInput}
            />
            <View style={styles.modalRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setAddTextOpen(false)}
              >
                <Text style={styles.modalCancelText}>ביטול</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalOk]}
                onPress={confirmAddText}
              >
                <Text style={styles.modalOkText}>הוסף</Text>
              </Pressable>
            </View>
            <Text style={styles.modalHint}>
              טיפ: תעשה זום על העמוד ואז יהיה הרבה יותר קל לדייק גרירה/צביטה של
              טקסטים וחתימה.
            </Text>
          </View>
        </View>
      </Modal>

      {pdfBase64 && (
        <View style={styles.hidden}>
          <PdfPageToPngWebView
            pdfBase64={pdfBase64}
            pageNumber={pageNumber}
            onRendered={(dataUrl, meta) => {
              setPngDataUrl(String(dataUrl));
              setPngSize({ w: meta.width, h: meta.height });
              setIsRendering(false);
            }}
            onError={() => setIsRendering(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#eef2ff" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "900" },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  closeText: { fontSize: 18, fontWeight: "900", opacity: 0.8 },
  stageWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  loadingBox: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stageResponder: { flex: 1 },
  stageTransform: { flex: 1 },
  actions: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#6d28d9",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionText: { color: "white", fontWeight: "900", fontSize: 16 },
  secondaryBtn: {
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontWeight: "900", opacity: 0.85 },
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    left: -1000,
    top: -1000,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 16,
    gap: 12,
    elevation: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  modalInput: {
    minHeight: 90,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "800",
    textAlignVertical: "top",
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  modalCancel: {
    backgroundColor: "#f1f5f9",
  },
  modalOk: {
    backgroundColor: "#6d28d9",
  },
  modalCancelText: { fontWeight: "900", opacity: 0.85 },
  modalOkText: { fontWeight: "900", color: "white" },
  modalHint: { opacity: 0.65, fontWeight: "700" },
});
