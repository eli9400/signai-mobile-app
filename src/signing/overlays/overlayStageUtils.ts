import type { Rect } from "../geometry";

export function calcContainRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): Rect {
  if (!containerW || !containerH || !contentW || !contentH) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  const scale = Math.min(containerW / contentW, containerH / contentH);
  const w = contentW * scale;
  const h = contentH * scale;
  const x = (containerW - w) / 2;
  const y = (containerH - h) / 2;

  return { x, y, w, h };
}
