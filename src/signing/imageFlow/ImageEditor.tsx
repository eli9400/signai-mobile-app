import React, { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { calcImageBox } from "../geometry";
import type { SigItem } from "../hooks/useOverlayGestures";
import OverlayActionButtons from "../components/OverlayActionButtons";
import ImageEditorAddTextModal from "./imageEditor/ImageEditorAddTextModal";
import ImageEditorEmptyState from "./imageEditor/ImageEditorEmptyState";
import ImageEditorExportLoading from "./imageEditor/ImageEditorExportLoading";
import ImageEditorExportView from "./imageEditor/ImageEditorExportView";
import ImageEditorHeader from "./imageEditor/ImageEditorHeader";
import ImageEditorStage from "./imageEditor/ImageEditorStage";
import { styles } from "./imageEditor/ImageEditor.styles";
import { type ImageEditorProps, type TextTarget } from "./imageEditor/types";
import { useAddText } from "./imageEditor/useAddText";
import { useImageExport } from "./imageEditor/useImageExport";
import { useStagePanZoom } from "./imageEditor/useStagePanZoom";

export default function ImageEditor({
  imageUri,
  imageSize,
  setImageSize,
  isLoading,
  onClose,
  signatureUri,
  editState,
  setEditState,
  onExportComplete,
  canUseAction = true,
}: ImageEditorProps) {
  const { t } = useTranslation();

  type ViewRef = React.ElementRef<typeof View>;

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const imageBoxRef = useRef<ViewRef | null>(null);
  const isOverlayInteractingRef = useRef(false);

  const { pageScale, pageTx, pageTy, onStageStart, onStageMove, onStageEnd } =
    useStagePanZoom(isOverlayInteractingRef);

  const canShowImage = Boolean(imageUri && imageSize);
  const nextTextTarget: TextTarget = !editState.name1.trim()
    ? "name1"
    : !editState.name2.trim()
      ? "name2"
      : null;

  const imageBox = useMemo(() => {
    if (!imageSize) return null;
    return calcImageBox(
      containerSize.w,
      containerSize.h,
      imageSize.w,
      imageSize.h,
    );
  }, [imageSize, containerSize.w, containerSize.h]);

  const { isExporting, exportImage } = useImageExport({
    canShowImage,
    imageBoxRef,
    shareTitle: t("imageEditor.export.shareTitle"),
    onExportComplete,
  });
  const canExport = canShowImage && !isExporting && canUseAction;

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

  const {
    addTextOpen,
    addTextValue,
    setAddTextValue,
    openAddText,
    cancelAddText,
    confirmAddText,
  } = useAddText({ nextTextTarget, setEditState });

  const handleStageLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    const h = e.nativeEvent.layout.height;
    setContainerSize({ w, h });
  };

  return (
    <View style={styles.root}>
      <ImageEditorHeader
        title={t("imageEditor.title")}
        onClose={onClose}
        showExport={Boolean(imageUri)}
        onExport={exportImage}
        exportDisabled={!canExport}
        exportLabel={t("imageEditor.actions.export")}
      />

      {!imageUri ? (
        <ImageEditorEmptyState
          text={t("imageEditor.empty.picking")}
          loading={isLoading}
        />
      ) : (
        <>
          <ImageEditorStage
            imageUri={imageUri}
            imageSize={imageSize}
            setImageSize={(size) => setImageSize(size)}
            isExporting={isExporting}
            imageBox={imageBox}
            onStageLayout={handleStageLayout}
            shouldSetResponder={() => !isOverlayInteractingRef.current}
            onStageStart={onStageStart}
            onStageMove={onStageMove}
            onStageEnd={onStageEnd}
            pageScale={pageScale}
            pageTx={pageTx}
            pageTy={pageTy}
            signatureUri={signatureUri}
            editState={editState}
            setEditState={setEditState}
            onInteractionStart={() => {
              isOverlayInteractingRef.current = true;
            }}
            onInteractionEnd={() => {
              isOverlayInteractingRef.current = false;
            }}
            loadingText={t("imageEditor.loadingImage")}
          />

          <ImageEditorExportView
            visible={isExporting}
            imageUri={imageUri}
            imageSize={imageSize}
            imageBox={imageBox}
            signatureUri={signatureUri}
            editState={editState}
            imageBoxRef={imageBoxRef}
          />

          <OverlayActionButtons
            primaryLabel={
              nextTextTarget
                ? t("imageEditor.actions.addText")
                : t("imageEditor.actions.textsLimitReached")
            }
            primaryDisabled={!nextTextTarget}
            onPrimaryPress={openAddText}
            secondaryLabel={t("imageEditor.actions.addSignature")}
            secondaryDisabled={!signatureUri}
            onSecondaryPress={addSignature}
          />
        </>
      )}

      <ImageEditorExportLoading
        open={isExporting}
        title={t("imageEditor.export.exporting")}
        hint={t("imageEditor.export.pleaseWait")}
      />

      <ImageEditorAddTextModal
        open={addTextOpen}
        value={addTextValue}
        onChange={setAddTextValue}
        onCancel={cancelAddText}
        onConfirm={confirmAddText}
        title={t("imageEditor.modal.addTextTitle")}
        placeholder={t("imageEditor.modal.addTextPlaceholder")}
        cancelLabel={t("common.actions.cancel")}
        confirmLabel={t("common.actions.add")}
        hint={t("imageEditor.modal.tip")}
      />
    </View>
  );
}
