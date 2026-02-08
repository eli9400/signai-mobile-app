import type { Dispatch, SetStateAction } from "react";
import type { Point, Rect } from "../geometry";
import type { SigItem } from "../hooks/useOverlayGestures";

export type Size = { w: number; h: number };

export type OverlayStageProps = {
  imageUri: string;
  imageSize: Size;
  isDisabled?: boolean;

  // whether to render signatures at all
  sigEnabled?: boolean;

  // signature image source (same image for all sig items for now)
  signatureUri: string | null;

  // multi signatures
  sigItems: SigItem[];
  setSigItems: Dispatch<SetStateAction<SigItem[]>>;

  activeSigId: string | null;
  setActiveSigId: (id: string | null) => void;

  // text 1
  name1: string;
  setName1: (s: string) => void;
  name1Pos: Point;
  setName1Pos: (p: Point) => void;
  name1Font: number;
  setName1Font: (n: number) => void;

  // text 2
  name2: string;
  setName2: (s: string) => void;
  name2Pos: Point;
  setName2Pos: (p: Point) => void;
  name2Font: number;
  setName2Font: (n: number) => void;

  minSigW?: number;
  maxSigW?: number;
  minFont?: number;
  maxFont?: number;

  isPinchEnabled?: boolean;
  textClampPadding?: number;

  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;

  // page scale for coordinate correction
  pageScale?: number;

  // notify computed image rect in stage coords (for export normalization)
  onImageRect?: (rect: Rect) => void;
};
