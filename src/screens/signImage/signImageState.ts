export type Point = { x: number; y: number };
export type Size = { w: number; h: number };

export type ImageEditState = {
  sigEnabled: boolean;
  sigItems: { id: string; pos: Point; size: Size }[];
  activeSigId: string | null;
  name1: string;
  name1Pos: Point;
  name1Font: number;
  name2: string;
  name2Pos: Point;
  name2Font: number;
};

export const createInitialEditState = (): ImageEditState => ({
  sigEnabled: false,
  sigItems: [],
  activeSigId: null,
  name1: "",
  name1Pos: { x: 20, y: 140 },
  name1Font: 28,
  name2: "",
  name2Pos: { x: 20, y: 210 },
  name2Font: 28,
});
