// src/signing/imageFlow/ImageEditor.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from "react-native";

import OverlayStage from "../overlays/OverlayStage";
import { BackIconButton, ExportPngPillButton } from "../../ui/icons";
import type { ImageEditState } from "../../screens/SignImageScreen";
import type { SigItem } from "../hooks/useOverlayGestures";
import { exportAndSharePng } from "../export/exportAndSharePng";
import { Ionicons } from "@expo/vector-icons";
import { calcImageBox, type Rect } from "../geometry";

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

type Props = {
  imageUri: string | null;
  imageSize: { w: number; h: number } | null;
  setImageSize: (size: { w: number; h: number }) => void;
  isLoading: boolean;
  onClose: () => void;
  onPickImage: () => void;
  signatureUri: string | null;
  editState: ImageEditState;
  setEditState: Dispatch<SetStateAction<ImageEditState>>;
};

export default function ImageEditor({
  imageUri,
  imageSize,
  setImageSize,
  isLoading,
  onClose,
  onPickImage,
  signatureUri,
  editState,
  setEditState,
}: Props) {
  const [containerSize, setContainerSize] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });

  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addTextValue, setAddTextValue] = useState("");

  const [pageScale, setPageScale] = useState(1);
  const [pageTx, setPageTx] = useState(0);
  const [pageTy, setPageTy] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  const stageRef = useRef<View>(null);
  const imageBoxRef = useRef<View>(null);

  const canShowImage = Boolean(imageUri && imageSize);
  const nextTextTarget = !editState.name1.trim()
    ? "name1"
    : !editState.name2.trim()
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

  const imageBox: Rect | null = useMemo(() => {
    if (!imageSize) return null;
    return calcImageBox(
      containerSize.w,
      containerSize.h,
      imageSize.w,
      imageSize.h,
    );
  }, [imageSize, containerSize.w, containerSize.h]);

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

    const id = `sig_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const next: SigItem = {
      id,
      pos: { x: 24, y: 24 },
      size: { w: 180, h: 90 },
    };

    setEditState((prev) => {
      const currentItems = Array.isArray(prev.sigItems) ? prev.sigItems : [];
      return {
        ...prev,
        sigEnabled: true,
        sigItems: [...currentItems, next],
        activeSigId: id,
      };
    });
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
      setEditState((prev) => ({
        ...prev,
        name1: t,
        name1Pos: { x: 24, y: 160 },
        name1Font: 30,
      }));
    } else {
      setEditState((prev) => ({
        ...prev,
        name2: t,
        name2Pos: { x: 24, y: 240 },
        name2Font: 30,
      }));
    }

    setAddTextOpen(false);
  };

  const exportImage = async () => {
    if (!canShowImage) {
      return;
    }

    try {
      setIsExporting(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!imageBoxRef.current) {
        setIsExporting(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      await exportAndSharePng({
        viewRef: imageBoxRef,
        beforeCaptureDelayMs: 100,
        dialogTitle: "שתף תמונה חתומה",
      });
    } catch (e: any) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
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

  const onStageLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    const h = e.nativeEvent.layout.height;
    setContainerSize({ w, h });
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <BackIconButton onPress={onClose} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>עריכת תמונה</Text>
        </View>
        {imageUri && (
          <ExportPngPillButton
            onPress={exportImage}
            disabled={!canShowImage || isExporting}
            label="ייצא"
          />
        )}
      </View>

      {!imageUri ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🖼️</Text>
          <Text style={styles.emptyText}>בוחר תמונה...</Text>
          {isLoading && <ActivityIndicator color="#6d28d9" />}
        </View>
      ) : (
        <>
          <View
            ref={stageRef}
            style={styles.stageWrap}
            onLayout={onStageLayout}
          >
            <View
              style={[
                styles.imageContainer,
                isExporting && styles.imageContainerExport,
              ]}
            >
              <View collapsable={false} style={styles.captureView}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoad={(e) => {
                    const src = e.nativeEvent?.source;
                    if (src?.width && src?.height) {
                      setImageSize({ w: src.width, h: src.height });
                    }
                  }}
                  onError={() => {
                    // Image load failed
                  }}
                />

                {imageBox && imageSize && !isExporting && (
                  <View
                    style={[
                      styles.overlayBox,
                      {
                        left: imageBox.x,
                        top: imageBox.y,
                        width: imageBox.w,
                        height: imageBox.h,
                      },
                    ]}
                    onStartShouldSetResponder={() =>
                      !isOverlayInteractingRef.current
                    }
                    onMoveShouldSetResponder={() =>
                      !isOverlayInteractingRef.current
                    }
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
                        imageUri={imageUri}
                        imageSize={imageSize}
                        signatureUri={signatureUri}
                        sigItems={
                          Array.isArray(editState.sigItems)
                            ? editState.sigItems
                            : []
                        }
                        setSigItems={(itemsOrUpdater) => {
                          setEditState((prev) => {
                            const currentItems = Array.isArray(prev.sigItems)
                              ? prev.sigItems
                              : [];

                            const newItems =
                              typeof itemsOrUpdater === "function"
                                ? itemsOrUpdater(currentItems)
                                : itemsOrUpdater;

                            const safeItems = Array.isArray(newItems)
                              ? newItems
                              : [];

                            return { ...prev, sigItems: safeItems };
                          });
                        }}
                        activeSigId={editState.activeSigId}
                        setActiveSigId={(id) =>
                          setEditState((prev) => ({ ...prev, activeSigId: id }))
                        }
                        sigEnabled={editState.sigEnabled}
                        name1={editState.name1}
                        setName1={(name1) =>
                          setEditState((prev) => ({ ...prev, name1 }))
                        }
                        name1Pos={editState.name1Pos}
                        setName1Pos={(name1Pos) =>
                          setEditState((prev) => ({ ...prev, name1Pos }))
                        }
                        name1Font={editState.name1Font}
                        setName1Font={(name1Font) =>
                          setEditState((prev) => ({ ...prev, name1Font }))
                        }
                        name2={editState.name2}
                        setName2={(name2) =>
                          setEditState((prev) => ({ ...prev, name2 }))
                        }
                        name2Pos={editState.name2Pos}
                        setName2Pos={(name2Pos) =>
                          setEditState((prev) => ({ ...prev, name2Pos }))
                        }
                        name2Font={editState.name2Font}
                        setName2Font={(name2Font) =>
                          setEditState((prev) => ({ ...prev, name2Font }))
                        }
                        pageScale={pageScale}
                        isDisabled={false}
                        onInteractionStart={() => {
                          isOverlayInteractingRef.current = true;
                        }}
                        onInteractionEnd={() => {
                          isOverlayInteractingRef.current = false;
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>

              {!imageSize && !isExporting && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#ffffff" size="large" />
                  <Text style={styles.loadingText}>טוען תמונה…</Text>
                </View>
              )}
            </View>
          </View>

          {/* Hidden export view - only rendered during export */}
          {isExporting && imageSize && (
            <View style={styles.hiddenExportContainer}>
              <View
                ref={imageBoxRef}
                collapsable={false}
                style={[
                  styles.exportView,
                  {
                    width: imageSize.w,
                    height: imageSize.h,
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />

                {/* Calculate scale factor between actual image and displayed image */}
                {(() => {
                  if (!imageBox) return null;

                  const scaleX = imageSize.w / imageBox.w;
                  const scaleY = imageSize.h / imageBox.h;

                  return (
                    <>
                      {/* Render signatures without borders */}
                      {editState.sigEnabled &&
                        signatureUri &&
                        editState.sigItems.map((sig) => (
                          <Image
                            key={sig.id}
                            source={{ uri: signatureUri }}
                            style={{
                              position: "absolute",
                              left: sig.pos.x * scaleX,
                              top: sig.pos.y * scaleY,
                              width: sig.size.w * scaleX,
                              height: sig.size.h * scaleY,
                            }}
                            resizeMode="contain"
                          />
                        ))}

                      {/* Render text without borders */}
                      {editState.name1.trim() && (
                        <Text
                          style={{
                            position: "absolute",
                            left: editState.name1Pos.x * scaleX,
                            top: editState.name1Pos.y * scaleY,
                            fontSize: editState.name1Font * scaleX,
                            fontWeight: "800",
                            color: "#000",
                          }}
                        >
                          {editState.name1}
                        </Text>
                      )}

                      {editState.name2.trim() && (
                        <Text
                          style={{
                            position: "absolute",
                            left: editState.name2Pos.x * scaleX,
                            top: editState.name2Pos.y * scaleY,
                            fontSize: editState.name2Font * scaleX,
                            fontWeight: "800",
                            color: "#000",
                          }}
                        >
                          {editState.name2}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.actionBtn,
                !nextTextTarget && styles.actionBtnDisabled,
              ]}
              onPress={openAddText}
              disabled={!nextTextTarget}
            >
              <Ionicons name="text-outline" size={18} color="white" />
              <Text style={styles.actionText}>
                {nextTextTarget ? "הוסף טקסט" : "כבר יש 2 טקסטים"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sigBtn, !signatureUri && styles.actionBtnDisabled]}
              onPress={addSignature}
              disabled={!signatureUri}
            >
              <Ionicons name="create-outline" size={18} color="#6d28d9" />
              <Text style={styles.sigBtnText}>הוסף חתימה</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Export loading indicator */}
      {isExporting && (
        <View style={styles.exportLoadingOverlay}>
          <View style={styles.exportLoadingCard}>
            <View style={styles.exportLoadingSpinner}>
              <ActivityIndicator size="large" color="#6d28d9" />
            </View>
            <Text style={styles.exportLoadingText}>מייצא תמונה...</Text>
            <Text style={styles.exportLoadingHint}>אנא המתן</Text>
          </View>
        </View>
      )}

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
              טיפ: תעשה זום על התמונה ואז יהיה הרבה יותר קל לדייק גרירה/צביטה של
              טקסטים וחתימה.
            </Text>
          </View>
        </View>
      </Modal>
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyIcon: { fontSize: 64, opacity: 0.3 },
  emptyText: { fontSize: 18, fontWeight: "800", opacity: 0.5 },
  stageWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#111",
    overflow: "hidden",
    position: "relative",
  },
  imageContainerExport: {
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  captureView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    opacity: 0.75,
    fontWeight: "800",
    color: "white",
  },
  overlayBox: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  stageTransform: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  hiddenExportContainer: {
    position: "absolute",
    left: -10000,
    top: -10000,
    opacity: 0,
  },
  exportView: {
    backgroundColor: "#ffffff",
    position: "relative",
  },
  actions: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#6d28d9",
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 2,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionText: { color: "white", fontWeight: "900", fontSize: 14 },
  sigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
  },
  sigBtnText: {
    color: "#6d28d9",
    fontWeight: "900",
    fontSize: 14,
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
  exportLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  exportLoadingCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 16,
    minWidth: 200,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  exportLoadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  exportLoadingText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1f2937",
  },
  exportLoadingHint: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
});
