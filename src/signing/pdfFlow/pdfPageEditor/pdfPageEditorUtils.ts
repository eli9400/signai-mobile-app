import type { NormPoint, NormSize } from "../../../screens/signPdf/signPdfTypes";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const toNormPoint = (
  p: { x: number; y: number },
  size: { w: number; h: number },
): NormPoint => ({
  x: clamp01(p.x / (size.w || 1)),
  y: clamp01(p.y / (size.h || 1)),
});

export const toNormSize = (
  s: { w: number; h: number },
  size: { w: number; h: number },
): NormSize => ({
  w: clamp01(s.w / (size.w || 1)),
  h: clamp01(s.h / (size.h || 1)),
});

export const fromNormPoint = (
  p: NormPoint,
  size: { w: number; h: number },
) => ({
  x: clamp01(p.x) * size.w,
  y: clamp01(p.y) * size.h,
});

export const fromNormSize = (
  s: NormSize,
  size: { w: number; h: number },
) => ({
  w: clamp01(s.w) * size.w,
  h: clamp01(s.h) * size.h,
});
