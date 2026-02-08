import { useEffect, useMemo, useState } from "react";
import type {
  NormPoint,
  NormSize,
  PageEditState,
} from "../../../screens/signPdf/signPdfTypes";
import type { SigItem } from "../../hooks/useOverlayGestures";
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

type TextTarget = "name1" | "name2" | null;

export function usePdfPageEditorState({ initialEdit, imageRectSize }: Args) {
  const [name1, setName1] = useState(initialEdit?.name1 ?? "");
  const [name2, setName2] = useState(initialEdit?.name2 ?? "");

  const [name1Pos, setName1Pos] = useState({ x: 20, y: 140 });
  const [name2Pos, setName2Pos] = useState({ x: 20, y: 210 });

  const [name1Font, setName1Font] = useState(28);
  const [name2Font, setName2Font] = useState(28);

  const [sigItems, setSigItems] = useState<SigItem[]>([]);
  const [activeSigId, setActiveSigId] = useState<string | null>(null);
  const [sigEnabled, setSigEnabled] = useState(
    initialEdit?.sigEnabled ?? false,
  );

  const nextTextTarget = useMemo<TextTarget>(() => {
    return !name1.trim() ? "name1" : !name2.trim() ? "name2" : null;
  }, [name1, name2]);

  useEffect(() => {
    if (!initialEdit) return;
    if (!imageRectSize?.w || !imageRectSize?.h) return;

    const size = { w: imageRectSize.w, h: imageRectSize.h };

    const toPxPoint = (p: NormPoint) => fromNormPoint(p, size);
    const toPxSize = (s: NormSize) => fromNormSize(s, size);

    setName1(initialEdit.name1 ?? "");
    setName2(initialEdit.name2 ?? "");

    setName1Pos(toPxPoint(initialEdit.name1Pos ?? { x: 0.03, y: 0.16 }));
    setName2Pos(toPxPoint(initialEdit.name2Pos ?? { x: 0.03, y: 0.24 }));

    setName1Font(
      Math.max(8, Math.round(clamp01(initialEdit.name1FontN ?? 0.03) * size.w)),
    );
    setName2Font(
      Math.max(8, Math.round(clamp01(initialEdit.name2FontN ?? 0.03) * size.w)),
    );

    setSigEnabled(Boolean(initialEdit.sigEnabled));

    const pxSigItems: SigItem[] = (initialEdit.sigItems ?? []).map((s) => ({
      id: s.id,
      pos: toPxPoint(s.pos),
      size: toPxSize(s.size),
    }));

    setSigItems(pxSigItems);
    setActiveSigId(initialEdit.activeSigId ?? null);
  }, [initialEdit, imageRectSize?.w, imageRectSize?.h]);

  const buildEditState = (
    pageNumber: number,
    size: { w: number; h: number },
  ): PageEditState => {
    const toNormP = (p: { x: number; y: number }) => toNormPoint(p, size);
    const toNormS = (s: { w: number; h: number }) => toNormSize(s, size);

    return {
      pageNumber,
      sigEnabled: Boolean(sigEnabled),
      sigItems: (sigItems ?? []).map((s) => ({
        id: s.id,
        pos: toNormP(s.pos),
        size: toNormS(s.size),
      })),
      activeSigId: activeSigId ?? null,
      name1: name1 ?? "",
      name1Pos: toNormP(name1Pos),
      name1FontN: clamp01((name1Font ?? 28) / (size.w || 1)),
      name2: name2 ?? "",
      name2Pos: toNormP(name2Pos),
      name2FontN: clamp01((name2Font ?? 28) / (size.w || 1)),
    };
  };

  return {
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
  };
}
