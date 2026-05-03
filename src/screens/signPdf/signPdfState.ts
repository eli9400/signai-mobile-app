import { type PageEditState } from "./signPdfTypes";

export const createDefaultPageEdit = (pageNumber: number): PageEditState => ({
  pageNumber,
  sigEnabled: true,
  sigItems: [],
  activeSigId: null,
  textItems: [],
  activeTextId: null,
});
