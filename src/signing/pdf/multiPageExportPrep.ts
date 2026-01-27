// src/signing/pdf/multiPageExportPrep.ts

export type ExportPage = {
  pageNumber: number;

  // required by MultiPagePdfConverter
  imageBase64: string; // "" means not prepared yet
  width: number;
  height: number;

  // used by selector
  selected: boolean;

  // ✅ required by PageSelectorModal / EditedPage shape
  hasSignature: boolean;
  hasText: boolean;

  // optional metadata (keep loose)
  [key: string]: any;
};

export function buildAllPagesForSelector(
  totalPages: number,
  editedPages: ExportPage[],
): ExportPage[] {
  const map = new Map<number, ExportPage>();
  for (const p of editedPages) map.set(p.pageNumber, p);

  const all: ExportPage[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const existing = map.get(i);
    if (existing) {
      all.push({
        ...existing,
        selected: existing.selected ?? true,
      });
    } else {
      all.push({
        pageNumber: i,
        imageBase64: "",
        width: 0,
        height: 0,
        selected: true, // ✅ default: include all pages

        // ✅ required by EditedPage type (PageSelectorModal expects this)
        hasSignature: false,
        hasText: false,
      });
    }
  }
  return all;
}

export function toggleSelectorPage(
  pages: ExportPage[],
  pageNumber: number,
): ExportPage[] {
  return pages.map((p) =>
    p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p,
  );
}

export function makeExportQueue(selectorPages: ExportPage[]): ExportPage[] {
  return selectorPages
    .filter((p) => p.selected)
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((p) => ({ ...p }));
}

export function isPrepared(p: ExportPage): boolean {
  return Boolean(p.imageBase64) && p.width > 0 && p.height > 0;
}

export function progress(queue: ExportPage[]): { done: number; total: number } {
  const total = queue.length;
  const done = queue.filter(isPrepared).length;
  return { done, total };
}

export function nextMissing(queue: ExportPage[]): ExportPage | null {
  return queue.find((p) => !p.imageBase64) ?? null;
}

export function updateQueueWithRenderedPage(
  queue: ExportPage[],
  rendered: {
    pageNumber: number;
    width: number;
    height: number;
    pngDataUrl: string;
  },
): ExportPage[] {
  const b64 = String(rendered.pngDataUrl).split(",")[1] ?? "";

  return queue.map((p) =>
    p.pageNumber === rendered.pageNumber
      ? {
          ...p,
          imageBase64: b64,
          width: rendered.width,
          height: rendered.height,
        }
      : p,
  );
}
