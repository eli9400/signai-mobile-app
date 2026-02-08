import type { Dispatch, SetStateAction } from "react";
import type { Point, Rect } from "../../geometry";

type Size = { w: number; h: number };
export type SigItem = { id: string; pos: Point; size: Size };

export type ActiveTarget =
  | { kind: "sig"; id: string }
  | "name1"
  | "name2"
  | null;

export type UseOverlayGesturesArgs = {
  imageBox: Rect | null;
  isDisabled?: boolean;
  isPinchEnabled?: boolean;
  sigItems: SigItem[];
  setSigItems: Dispatch<SetStateAction<SigItem[]>>;
  activeSigId: string | null;
  setActiveSigId: (id: string | null) => void;
  minSigW?: number;
  maxSigW?: number;
  name1Pos: Point;
  setName1Pos: (p: Point) => void;
  name1Font: number;
  setName1Font: (n: number) => void;
  name2Pos: Point;
  setName2Pos: (p: Point) => void;
  name2Font: number;
  setName2Font: (n: number) => void;
  minFont?: number;
  maxFont?: number;
  textClampPadding?: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  pageScale?: number;
};

export const DEFAULT_MIN_SIG_W = 50;
export const DEFAULT_MAX_SIG_W = 600;
export const DEFAULT_MIN_FONT = 8;
export const DEFAULT_MAX_FONT = 100;
