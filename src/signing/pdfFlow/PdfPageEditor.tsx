import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import type { PageEditState } from "../../screens/signPdf/signPdfTypes";
import type { Rect } from "../geometry";
import type { SigItem } from "../hooks/useOverlayGestures";
import OverlayActionButtons from "../components/OverlayActionButtons";
import PdfPageEditorAddTextModal from "./pdfPageEditor/PdfPageEditorAddTextModal";
import PdfPageEditorHeader from "./pdfPageEditor/PdfPageEditorHeader";
import PdfPageEditorRenderer from "./pdfPageEditor/PdfPageEditorRenderer";
import PdfPageEditorStage from "./pdfPageEditor/PdfPageEditorStage";
import { styles } from "./pdfPageEditor/PdfPageEditor.styles";
import { usePdfPageAddText } from "./pdfPageEditor/usePdfPageAddText";
import { usePdfPageBackHandler } from "./pdfPageEditor/usePdfPageBackHandler";
import { usePdfPageEditorState } from "./pdfPageEditor/usePdfPageEditorState";
import { usePdfPagePanZoom } from "./pdfPageEditor/usePdfPagePanZoom";
type Props = {
  title: string;
  onBackToGrid: (editState: PageEditState) => void;
  pdfBase64: string | null;
  pageNumber: number;
  signatureUri?: string | null;
  initialEdit?: PageEditState;
};

export default function PdfPageEditor({
  title,
  onBackToGrid,
  pdfBase64,
  pageNumber,
  signatureUri = null,
  initialEdit,
}: Props) {
  const { t } = useTranslation();
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [pngSize, setPngSize] = useState<{ w: number; h: number } | null>(null);
  const [imageRect, setImageRect] = useState<Rect | null>(null);

  const isOverlayInteractingRef = useRef(false);
  const { pageScale, pageTx, pageTy, resetZoom, onStageStart, onStageMove, onStageEnd } = usePdfPagePanZoom(isOverlayInteractingRef);

  useEffect(() => {
    setPngDataUrl(null);
    setPngSize(null);
    setImageRect(null);
    resetZoom();
  }, [pageNumber, pdfBase64, resetZoom]);

  const {
    name1,
    setName1,
    name2,
    setName2,
    name1Pos,
    setName1Pos,
    name2Pos,
    setName2Pos,
    name1Font,
    setName1Font,
    name2Font,
    setName2Font,
    sigItems,
    setSigItems,
    activeSigId,
    setActiveSigId,
    sigEnabled,
    setSigEnabled,
    nextTextTarget,
    buildEditState,
  } = usePdfPageEditorState({
    initialEdit,
    imageRectSize: imageRect ? { w: imageRect.w, h: imageRect.h } : null,
  });

  const normSize = imageRect?.w && imageRect?.h ? { w: imageRect.w, h: imageRect.h } : null;
  const { handleBackToGrid } = usePdfPageBackHandler({ pageNumber, normSize, buildEditState, onBackToGrid, t });

  const {
    addTextOpen,
    addTextValue,
    setAddTextValue,
    openAddText,
    cancelAddText,
    confirmAddText,
  } = usePdfPageAddText({
    nextTextTarget,
    setName1,
    setName1Pos,
    setName1Font,
    setName2,
    setName2Pos,
    setName2Font,
  });
  const addSignature = useCallback(() => {
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
  }, [signatureUri, sigEnabled, setActiveSigId, setSigEnabled, setSigItems]);

  const canShowStage = Boolean(pngDataUrl && pngSize);
  const shouldSetResponder = () => !isOverlayInteractingRef.current;

  return (
    <View style={styles.root}>
      <PdfPageEditorHeader title={title} onBack={handleBackToGrid} />

      <PdfPageEditorStage
        canShowStage={canShowStage}
        pngDataUrl={pngDataUrl}
        pngSize={pngSize}
        overlayState={{
          signatureUri: signatureUri ?? null,
          sigItems,
          setSigItems,
          activeSigId,
          setActiveSigId,
          name1,
          setName1,
          name1Pos,
          setName1Pos,
          name1Font,
          setName1Font,
          name2,
          setName2,
          name2Pos,
          setName2Pos,
          name2Font,
          setName2Font,
          sigEnabled,
        }}
        pageScale={pageScale}
        pageTx={pageTx}
        pageTy={pageTy}
        shouldSetResponder={shouldSetResponder}
        onStageStart={onStageStart}
        onStageMove={onStageMove}
        onStageEnd={onStageEnd}
        onInteractionStart={() => {
          isOverlayInteractingRef.current = true;
        }}
        onInteractionEnd={() => {
          isOverlayInteractingRef.current = false;
        }}
        onImageRect={setImageRect}
        loadingLabel={t("signPdf.pageEditor.loading")}
      />

      <OverlayActionButtons
        primaryLabel={
          nextTextTarget
            ? t("signPdf.pageEditor.actions.addText")
            : t("signPdf.pageEditor.actions.textsLimitReached")
        }
        primaryDisabled={!nextTextTarget}
        onPrimaryPress={openAddText}
        secondaryLabel={
          signatureUri
            ? t("signPdf.pageEditor.actions.addSignature")
            : t("signPdf.pageEditor.actions.noSignature")
        }
        secondaryDisabled={!signatureUri}
        onSecondaryPress={addSignature}
      />

      <PdfPageEditorAddTextModal
        open={addTextOpen}
        value={addTextValue}
        onChange={setAddTextValue}
        onCancel={cancelAddText}
        onConfirm={confirmAddText}
        title={t("signPdf.pageEditor.modal.title")}
        placeholder={t("signPdf.pageEditor.modal.placeholder")}
        cancelLabel={t("common.actions.cancel")}
        confirmLabel={t("common.actions.add")}
        hint={t("signPdf.pageEditor.modal.tip")}
      />

      {pdfBase64 && (
        <PdfPageEditorRenderer
          pdfBase64={pdfBase64}
          pageNumber={pageNumber}
          onRendered={(dataUrl, meta) => {
            setPngDataUrl(String(dataUrl));
            setPngSize({ w: meta.width, h: meta.height });
          }}
          onError={() => {}}
        />
      )}
    </View>
  );
}
