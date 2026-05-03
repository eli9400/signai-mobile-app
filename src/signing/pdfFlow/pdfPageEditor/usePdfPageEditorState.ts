import { useEffect, useState } from "react";
import type {
  NormPoint,
  NormSize,
  NormTextItem,
  PageEditState,
} from "../../../screens/signPdf/signPdfTypes";
import type { SigItem, TextItem } from "../../hooks/useOverlayGestures";
import {
  clamp01,
  fromNormPoint,
  fromNormSize,
  toNormPoint,
  toNormSize,
} from "./pdfPageEditorUtils";

type StageSize = { w: number; h: number } | null;

type Args = {
  initialEdit?: PageEditState;
  imageRectSize: StageSize;
};

const FALLBACK_TEXT_FONT_N = 0.03;

export function usePdfPageEditorState({ initialEdit, imageRectSize }: Args) {
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(
    initialEdit?.activeTextId ?? null,
  );

  const [sigItems, setSigItems] = useState<SigItem[]>([]);
  const [activeSigId, setActiveSigId] = useState<string | null>(null);
  const [sigEnabled, setSigEnabled] = useState(
    initialEdit?.sigEnabled ?? false,
  );

  useEffect(() => {
    if (!initialEdit) return;
    if (!imageRectSize?.w || !imageRectSize?.h) return;

    const size = { w: imageRectSize.w, h: imageRectSize.h };

    const toPxPoint = (p: NormPoint) => fromNormPoint(p, size);
    const toPxSize = (s: NormSize) => fromNormSize(s, size);

    setSigEnabled(Boolean(initialEdit.sigEnabled));

    const pxSigItems: SigItem[] = (initialEdit.sigItems ?? []).map((s) => ({
      id: s.id,
      pos: toPxPoint(s.pos),
      size: toPxSize(s.size),
    }));

    setSigItems(pxSigItems);
    setActiveSigId(initialEdit.activeSigId ?? null);

    let sourceNormTexts: NormTextItem[] = Array.isArray(initialEdit.textItems)
      ? initialEdit.textItems
      : [];

    if (sourceNormTexts.length === 0) {
      const legacyTexts: NormTextItem[] = [];
      if (initialEdit.name1?.trim() && initialEdit.name1Pos) {
        legacyTexts.push({
          id: "legacy_text_1",
          text: initialEdit.name1,
          pos: initialEdit.name1Pos,
          fontN: initialEdit.name1FontN ?? FALLBACK_TEXT_FONT_N,
        });
      }
      if (initialEdit.name2?.trim() && initialEdit.name2Pos) {
        legacyTexts.push({
          id: "legacy_text_2",
          text: initialEdit.name2,
          pos: initialEdit.name2Pos,
          fontN: initialEdit.name2FontN ?? FALLBACK_TEXT_FONT_N,
        });
      }
      sourceNormTexts = legacyTexts;
    }

    const pxTextItems: TextItem[] = sourceNormTexts
      .filter((item) => Boolean(item?.text?.trim()))
      .map((item, idx) => ({
        id: item.id || `txt_${idx}`,
        text: item.text,
        pos: toPxPoint(item.pos),
        font: Math.max(
          8,
          Math.round(clamp01(item.fontN ?? FALLBACK_TEXT_FONT_N) * size.w),
        ),
      }));

    setTextItems(pxTextItems);
    setActiveTextId(initialEdit.activeTextId ?? null);
  }, [initialEdit, imageRectSize?.w, imageRectSize?.h]);

  const buildEditState = (
    pageNumber: number,
    size: { w: number; h: number },
  ): PageEditState => {
    const toNormP = (p: { x: number; y: number }) => toNormPoint(p, size);
    const toNormS = (s: { w: number; h: number }) => toNormSize(s, size);
    const safeTextItems = Array.isArray(textItems) ? textItems : [];

    return {
      pageNumber,
      sigEnabled: Boolean(sigEnabled),
      sigItems: (sigItems ?? []).map((s) => ({
        id: s.id,
        pos: toNormP(s.pos),
        size: toNormS(s.size),
      })),
      activeSigId: activeSigId ?? null,
      textItems: safeTextItems
        .filter((item) => Boolean(item?.text?.trim()))
        .map((item) => ({
          id: item.id,
          text: item.text,
          pos: toNormP(item.pos),
          fontN: clamp01((item.font ?? 28) / (size.w || 1)),
        })),
      activeTextId:
        safeTextItems.some((item) => item.id === activeTextId)
          ? activeTextId
          : null,
    };
  };

  return {
    textItems,
    setTextItems,
    activeTextId,
    setActiveTextId,
    sigItems,
    setSigItems,
    activeSigId,
    setActiveSigId,
    sigEnabled,
    setSigEnabled,
    buildEditState,
  };
}
