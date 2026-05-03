import type { Dispatch, SetStateAction } from "react";
import type { Point, Rect } from "../../geometry";

type Size = { w: number; h: number };
export type SigItem = { id: string; pos: Point; size: Size };
export type TextItem = { id: string; text: string; pos: Point; font: number };

export type ActiveTarget =
  | { kind: "sig"; id: string }
  | { kind: "text"; id: string }
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
  textItems: TextItem[];
  setTextItems: Dispatch<SetStateAction<TextItem[]>>;
  activeTextId: string | null;
  setActiveTextId: (id: string | null) => void;
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
