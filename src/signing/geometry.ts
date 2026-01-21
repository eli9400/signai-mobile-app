// src/signing/geometry.ts

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function dist(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number },
) {
  const dx = a.pageX - b.pageX;
  const dy = a.pageY - b.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the exact drawn image box for `resizeMode="contain"`.
 * containerW/H: the stage size on screen
 * imageW/H: original image pixel size
 */
export function calcImageBox(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): Rect | null {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0)
    return null;

  // contain scale
  const scale = Math.min(containerW / imageW, containerH / imageH);
  const w = imageW * scale;
  const h = imageH * scale;

  const x = (containerW - w) / 2;
  const y = (containerH - h) / 2;

  return { x, y, w, h };
}

/**
 * Clamp a point so an overlay stays inside a box.
 * overlayW/H are the overlay dimensions.
 */
export function clampPosInsideBox(
  pos: Point,
  box: Rect,
  overlayW: number,
  overlayH: number,
): Point {
  const maxX = Math.max(0, box.w - overlayW);
  const maxY = Math.max(0, box.h - overlayH);
  return {
    x: clamp(pos.x, 0, maxX),
    y: clamp(pos.y, 0, maxY),
  };
}

/**
 * Loose clamp for text-like overlays when you don't know their exact width/height.
 */
export function clampPosLoose(pos: Point, box: Rect, padding = 40): Point {
  const maxX = Math.max(0, box.w - padding);
  const maxY = Math.max(0, box.h - padding);
  return {
    x: clamp(pos.x, 0, maxX),
    y: clamp(pos.y, 0, maxY),
  };
}
