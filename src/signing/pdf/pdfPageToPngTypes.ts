export type Quality = "high" | "thumb";

export type PdfPageRenderMeta = {
  width: number;
  height: number;
  pageNumber: number;
  totalPages: number;
  quality: Quality;
};

export type PdfPageToPngMessage =
  | { type: "ready" }
  | ({ type: "rendered"; pngDataUrl: string } & PdfPageRenderMeta)
  | { type: "error"; message: string };
