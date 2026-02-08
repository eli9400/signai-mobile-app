// Normalized coordinates (0..1) relative to the PAGE content box
export type NormPoint = { x: number; y: number };
export type NormSize = { w: number; h: number };

export type PageEditState = {
  pageNumber: number;
  sigEnabled: boolean;
  sigItems: { id: string; pos: NormPoint; size: NormSize }[];
  activeSigId: string | null;
  name1: string;
  name1Pos: NormPoint;
  name1FontN: number; // normalized relative to page width (e.g., 0.03)
  name2: string;
  name2Pos: NormPoint;
  name2FontN: number;
};
