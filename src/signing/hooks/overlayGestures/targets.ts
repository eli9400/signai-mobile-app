import type { Dispatch, SetStateAction } from "react";
import type { Point } from "../../geometry";
import type { ActiveTarget, SigItem } from "./types";

type TargetOpsArgs = {
  sigItems: SigItem[];
  setSigItems: Dispatch<SetStateAction<SigItem[]>>;
  name1Pos: Point;
  setName1Pos: (p: Point) => void;
  name1Font: number;
  setName1Font: (n: number) => void;
  name2Pos: Point;
  setName2Pos: (p: Point) => void;
  name2Font: number;
  setName2Font: (n: number) => void;
};

export const isSigTarget = (
  t: ActiveTarget,
): t is { kind: "sig"; id: string } =>
  Boolean(t && typeof t === "object" && (t as any).kind === "sig");

export const findSig = (sigItems: SigItem[], id: string | null | undefined) =>
  id ? sigItems.find((s) => s.id === id) ?? null : null;

export function createTargetOps(args: TargetOpsArgs) {
  const getTargetPos = (t: ActiveTarget): Point => {
    if (isSigTarget(t)) return findSig(args.sigItems, t.id)?.pos ?? { x: 0, y: 0 };
    if (t === "name1") return args.name1Pos;
    if (t === "name2") return args.name2Pos;
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
    if (t === "name1") args.setName1Pos(p);
    else if (t === "name2") args.setName2Pos(p);
  };

  const getTargetFont = (t: ActiveTarget): number => {
    if (t === "name1") return args.name1Font;
    if (t === "name2") return args.name2Font;
    return 0;
  };

  const setTargetFont = (t: ActiveTarget, v: number) => {
    if (t === "name1") args.setName1Font(v);
    else if (t === "name2") args.setName2Font(v);
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
): ActiveTarget {
  const t = pinchTarget ?? dragTarget ?? activeTarget;
  if (t) return t;
  if (activeSigId) return { kind: "sig", id: activeSigId };
  return null;
}
