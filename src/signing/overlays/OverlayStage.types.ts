import type { Dispatch, SetStateAction } from "react";
import type { Rect } from "../geometry";
import type { SigItem, TextItem } from "../hooks/useOverlayGestures";

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

  // multi text blocks
  textItems: TextItem[];
  setTextItems: Dispatch<SetStateAction<TextItem[]>>;
  activeTextId: string | null;
  setActiveTextId: (id: string | null) => void;

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
