import { type PageEditState } from "./signPdfTypes";

export const createDefaultPageEdit = (pageNumber: number): PageEditState => ({
  pageNumber,
  sigEnabled: true,
  sigItems: [],
  activeSigId: null,
  name1: "",
  name1Pos: { x: 0.03, y: 0.16 },
  name1FontN: 0.03,
  name2: "",
  name2Pos: { x: 0.03, y: 0.24 },
  name2FontN: 0.03,
});
