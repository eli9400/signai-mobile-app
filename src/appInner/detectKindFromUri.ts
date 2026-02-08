import type { OpenKind } from "./types";

export function detectKindFromUri(uri: string): OpenKind {
  const clean = uri.split("?")[0].toLowerCase();

  // PDFs
  if (clean.endsWith(".pdf") || clean.includes("pdf")) return "pdf";

  // Images
  if (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".heic") ||
    clean.endsWith(".gif")
  ) {
    return "image";
  }

  // content:// without extension -> default pdf (common for open-with)
  return "pdf";
}
