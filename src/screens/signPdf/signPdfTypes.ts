// Normalized coordinates (0..1) relative to the PAGE content box
export type NormPoint = { x: number; y: number };
export type NormSize = { w: number; h: number };
export type NormTextItem = {
  id: string;
  text: string;
  pos: NormPoint;
  fontN: number;
};

export type PageEditState = {
  pageNumber: number;
  sigEnabled: boolean;
  sigItems: { id: string; pos: NormPoint; size: NormSize }[];
  activeSigId: string | null;
  textItems: NormTextItem[];
  activeTextId: string | null;
  // Legacy fields kept optional for backward compatibility with older in-memory edits.
  name1?: string;
  name1Pos?: NormPoint;
  name1FontN?: number;
  name2?: string;
  name2Pos?: NormPoint;
  name2FontN?: number;
};
