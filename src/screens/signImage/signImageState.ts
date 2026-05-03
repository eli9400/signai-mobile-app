export type Point = { x: number; y: number };
export type Size = { w: number; h: number };
export type TextItem = {
  id: string;
  text: string;
  pos: Point;
  font: number;
};

export type ImageEditState = {
  sigEnabled: boolean;
  sigItems: { id: string; pos: Point; size: Size }[];
  activeSigId: string | null;
  textItems: TextItem[];
  activeTextId: string | null;
};

export const createInitialEditState = (): ImageEditState => ({
  sigEnabled: false,
  sigItems: [],
  activeSigId: null,
  textItems: [],
  activeTextId: null,
});
