import type { Dispatch, SetStateAction } from "react";
import type { Point } from "../../geometry";
import type { ActiveTarget, SigItem, TextItem } from "./types";

type TargetOpsArgs = {
  sigItems: SigItem[];
  setSigItems: Dispatch<SetStateAction<SigItem[]>>;
  textItems: TextItem[];
  setTextItems: Dispatch<SetStateAction<TextItem[]>>;
};

export const isSigTarget = (
  t: ActiveTarget,
): t is { kind: "sig"; id: string } =>
  Boolean(t && typeof t === "object" && (t as any).kind === "sig");
export const isTextTarget = (
  t: ActiveTarget,
): t is { kind: "text"; id: string } =>
  Boolean(t && typeof t === "object" && (t as any).kind === "text");

export const findSig = (sigItems: SigItem[], id: string | null | undefined) =>
  id ? sigItems.find((s) => s.id === id) ?? null : null;
export const findText = (textItems: TextItem[], id: string | null | undefined) =>
  id ? textItems.find((t) => t.id === id) ?? null : null;

export function createTargetOps(args: TargetOpsArgs) {
  const getTargetPos = (t: ActiveTarget): Point => {
    if (isSigTarget(t)) return findSig(args.sigItems, t.id)?.pos ?? { x: 0, y: 0 };
    if (isTextTarget(t)) return findText(args.textItems, t.id)?.pos ?? { x: 0, y: 0 };
    return { x: 0, y: 0 };
  };

  const setTargetPos = (t: ActiveTarget, p: Point) => {
    if (isSigTarget(t)) {
      const id = t.id;
      args.setSigItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, pos: p } : s)),
      );
      return;
    }
    if (isTextTarget(t)) {
      const id = t.id;
      args.setTextItems((prev) =>
        prev.map((txt) => (txt.id === id ? { ...txt, pos: p } : txt)),
      );
    }
  };

  const getTargetFont = (t: ActiveTarget): number => {
    if (isTextTarget(t)) return findText(args.textItems, t.id)?.font ?? 0;
    return 0;
  };

  const setTargetFont = (t: ActiveTarget, v: number) => {
    if (isTextTarget(t)) {
      const id = t.id;
      args.setTextItems((prev) =>
        prev.map((txt) => (txt.id === id ? { ...txt, font: v } : txt)),
      );
    }
  };

  const getSigSizeForTarget = (t: ActiveTarget): { w: number; h: number } =>
    isSigTarget(t) ? findSig(args.sigItems, t.id)?.size ?? { w: 0, h: 0 } : { w: 0, h: 0 };

  const setSigSizeForId = (id: string, nextSize: { w: number; h: number }) => {
    args.setSigItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, size: nextSize } : s)),
    );
  };

  const setSigPosForId = (id: string, nextPos: Point) => {
    args.setSigItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pos: nextPos } : s)),
    );
  };

  return {
    getTargetPos,
    setTargetPos,
    getTargetFont,
    setTargetFont,
    getSigSizeForTarget,
    setSigSizeForId,
    setSigPosForId,
  };
}

export function resolvePinchTarget(
  pinchTarget: ActiveTarget,
  dragTarget: ActiveTarget,
  activeTarget: ActiveTarget,
  activeSigId: string | null,
  activeTextId: string | null,
): ActiveTarget {
  const t = pinchTarget ?? dragTarget ?? activeTarget;
  if (t) return t;
  if (activeSigId) return { kind: "sig", id: activeSigId };
  if (activeTextId) return { kind: "text", id: activeTextId };
  return null;
}
