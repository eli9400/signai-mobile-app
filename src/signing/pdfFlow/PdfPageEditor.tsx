// src/signing/pdfFlow/PdfPageEditor.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";

import PdfPageToPngWebView from "../pdf/PdfPageToPngWebView";
import OverlayStage from "../overlays/OverlayStage";
import { BackIconButton } from "../../ui/icons";
import type {
  PageEditState,
  NormPoint,
  NormSize,
} from "../../screens/SignPdfScreen";
import type { SigItem } from "../hooks/useOverlayGestures";

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

type Props = {
  title: string;
  onBackToGrid: (editState: PageEditState) => void;
  pdfBase64: string | null;
  pageNumber: number;
  signatureUri?: string | null;
  initialEdit?: PageEditState;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function PdfPageEditor({
  title,
  onBackToGrid,
  pdfBase64,
  pageNumber,
  signatureUri = null,
  initialEdit,
}: Props) {
  const { t } = useTranslation();
  const [isRendering, setIsRendering] = useState(true);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [pngSize, setPngSize] = useState<{ w: number; h: number } | null>(null);

  // Local (pixel) state for OverlayStage interactions
  const [name1, setName1] = useState(initialEdit?.name1 ?? "");
  const [name2, setName2] = useState(initialEdit?.name2 ?? "");

  const [name1Pos, setName1Pos] = useState<{ x: number; y: number }>({
    x: 20,
    y: 140,
  });
  const [name2Pos, setName2Pos] = useState<{ x: number; y: number }>({
    x: 20,
    y: 210,
  });

  const [name1Font, setName1Font] = useState(28);
  const [name2Font, setName2Font] = useState(28);

  const [sigItems, setSigItems] = useState<SigItem[]>([]);
  const [activeSigId, setActiveSigId] = useState<string | null>(null);
  const [sigEnabled, setSigEnabled] = useState(
    initialEdit?.sigEnabled ?? false,
  );

  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addTextValue, setAddTextValue] = useState("");

  const [pageScale, setPageScale] = useState(1);
  const [pageTx, setPageTx] = useState(0);
  const [pageTy, setPageTy] = useState(0);

  const canShowStage = Boolean(pngDataUrl && pngSize);
  const nextTextTarget = useMemo(() => {
    return !name1.trim() ? "name1" : !name2.trim() ? "name2" : null;
  }, [name1, name2]);

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

  // Reset render when page/pdf changes
  useEffect(() => {
    setIsRendering(true);
    setPngDataUrl(null);
    setPngSize(null);

    // Reset zoom/pan
    setPageScale(1);
    setPageTx(0);
    setPageTy(0);
    pinchRef.current.isPinching = false;
    panRef.current.isPanning = false;
  }, [pageNumber, pdfBase64]);

  // When pngSize + initialEdit available: load normalized edit into pixel state
  useEffect(() => {
    if (!initialEdit) return;
    if (!pngSize?.w || !pngSize?.h) return;

    const W = pngSize.w;
    const H = pngSize.h;

    const fromNormPoint = (p: NormPoint) => ({
      x: clamp01(p.x) * W,
      y: clamp01(p.y) * H,
    });

    const fromNormSize = (s: NormSize) => ({
      w: clamp01(s.w) * W,
      h: clamp01(s.h) * H,
    });

    setName1(initialEdit.name1 ?? "");
    setName2(initialEdit.name2 ?? "");

    setName1Pos(fromNormPoint(initialEdit.name1Pos ?? { x: 0.03, y: 0.16 }));
    setName2Pos(fromNormPoint(initialEdit.name2Pos ?? { x: 0.03, y: 0.24 }));

    // fontN is relative to width
    setName1Font(
      Math.max(8, Math.round(clamp01(initialEdit.name1FontN ?? 0.03) * W)),
    );
    setName2Font(
      Math.max(8, Math.round(clamp01(initialEdit.name2FontN ?? 0.03) * W)),
    );

    setSigEnabled(Boolean(initialEdit.sigEnabled));

    const pxSigItems: SigItem[] = (initialEdit.sigItems ?? []).map((s) => ({
      id: s.id,
      pos: fromNormPoint(s.pos),
      size: fromNormSize(s.size),
    }));

    setSigItems(pxSigItems);
    setActiveSigId(initialEdit.activeSigId ?? null);
  }, [initialEdit, pngSize?.w, pngSize?.h]);

  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));

  const resetZoom = () => {
    setPageScale(1);
    setPageTx(0);
    setPageTy(0);
    pinchRef.current.isPinching = false;
    panRef.current.isPanning = false;
  };

  const addSignature = () => {
    if (!signatureUri) return;

    if (!sigEnabled) setSigEnabled(true);

    const id = `sig_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const next: SigItem = {
      id,
      pos: { x: 24, y: 24 },
      size: { w: 180, h: 90 },
    };

    setSigItems((prev) => [...prev, next]);
    setActiveSigId(id);
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

  // Convert pixel state -> normalized edit state and go back
  const handleBackToGrid = () => {
    if (!pngSize?.w || !pngSize?.h) {
      Alert.alert(
        t("common.alerts.errorTitle"),
        t("signPdf.pageEditor.pageNotReady"),
      );
      return;
    }

    const W = pngSize.w;
    const H = pngSize.h;

    const toNormPoint = (p: { x: number; y: number }): NormPoint => ({
      x: clamp01(p.x / (W || 1)),
      y: clamp01(p.y / (H || 1)),
    });

    const toNormSize = (s: { w: number; h: number }): NormSize => ({
      w: clamp01(s.w / (W || 1)),
      h: clamp01(s.h / (H || 1)),
    });

    const editState: PageEditState = {
      pageNumber,

      sigEnabled: Boolean(sigEnabled),
      sigItems: (sigItems ?? []).map((s) => ({
        id: s.id,
        pos: toNormPoint(s.pos),
        size: toNormSize(s.size),
      })),
      activeSigId: activeSigId ?? null,

      name1: name1 ?? "",
      name1Pos: toNormPoint(name1Pos),
      name1FontN: clamp01((name1Font ?? 28) / (W || 1)),

      name2: name2 ?? "",
      name2Pos: toNormPoint(name2Pos),
      name2FontN: clamp01((name2Font ?? 28) / (W || 1)),
    };

    onBackToGrid(editState);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // בזמן עריכת עמוד – תמיד נשמור ונחזור לגריד
      handleBackToGrid();
      return true; // עצרנו את ברירת המחדל
    });

    return () => sub.remove();
  }, [
    handleBackToGrid,
    // תלותים שמרכיבים את ה-editState
    pageNumber,
    sigItems,
    activeSigId,
    sigEnabled,
    name1,
    name1Pos,
    name1Font,
    name2,
    name2Pos,
    name2Font,
    pngSize?.w,
    pngSize?.h,
  ]);


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
        <BackIconButton onPress={handleBackToGrid} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>{title}</Text>
        </View>
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
                sigItems={sigItems}
                setSigItems={setSigItems}
                activeSigId={activeSigId}
                setActiveSigId={setActiveSigId}
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
                sigEnabled={sigEnabled}
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
              {t("signPdf.pageEditor.loading")}
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
            {nextTextTarget
              ? t("signPdf.pageEditor.actions.addText")
              : t("signPdf.pageEditor.actions.textsLimitReached")}
          </Text>
        </Pressable>

        <Pressable
          onPress={addSignature}
          disabled={!signatureUri}
          style={[
            styles.secondaryBtn,
            !signatureUri && styles.secondaryBtnDisabled,
          ]}
        >
          <Text style={styles.secondaryText}>
            {!signatureUri
              ? t("signPdf.pageEditor.actions.noSignature")
              : t("signPdf.pageEditor.actions.addSignature")}
          </Text>
        </Pressable>
      </View>      <Modal
        visible={addTextOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddTextOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t("signPdf.pageEditor.modal.title")}
            </Text>
            <TextInput
              value={addTextValue}
              onChangeText={setAddTextValue}
              placeholder={t("signPdf.pageEditor.modal.placeholder")}
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
                <Text style={styles.modalCancelText}>
                  {t("common.actions.cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalOk]}
                onPress={confirmAddText}
              >
                <Text style={styles.modalOkText}>
                  {t("common.actions.add")}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.modalHint}>
              {t("signPdf.pageEditor.modal.tip")}
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
  secondaryBtnDisabled: {
    opacity: 0.5,
  },
});

