// src/utils/incomingFile.ts
import * as FileSystem from "expo-file-system/legacy";

export class IncomingFilePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncomingFilePermissionError";
  }
}

function extFromMime(mime?: string) {
  const m = (mime || "").toLowerCase();

  // IMPORTANT: PDF first
  if (m === "application/pdf" || m.includes("pdf")) return "pdf";

  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("heic") || m.includes("heif")) return "heic";
  if (m.includes("gif")) return "gif";
  if (m.includes("jpg") || m.includes("jpeg")) return "jpg";
  return undefined;
}

function extFromUri(uri: string) {
  const clean = uri.split("?")[0];

  // אם זה נגמר בנקודה (DOC-...WA0025.) אין סיומת אמיתית
  if (clean.endsWith(".")) return undefined;

  const match = clean.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase();
}

function getWritableDir(): string {
  const dir: string | undefined =
    (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;

  if (!dir) {
    throw new Error(
      "No writable directory available (cacheDirectory/documentDirectory missing)",
    );
  }

  return dir.endsWith("/") ? dir : dir + "/";
}

function isPermissionError(e: any) {
  const msg = String(e?.message || e);
  return (
    msg.includes("SecurityException") ||
    msg.includes("Permission Denial") ||
    msg.includes("requires the provider be exported") ||
    msg.includes("grantUriPermission")
  );
}

/**
 * Ensures incoming uri is a local file:// with a GOOD extension (.pdf/.jpg/...)
 * even if the original uri has no extension (common in shares).
 */
export async function cacheIncomingUri(
  uri: string,
  mime?: string,
  fileNameHint?: string,
) {
  const decoded = decodeURI(uri);
  const dir = getWritableDir();

  const inferredExt =
    // 1) from mime
    extFromMime(mime) ||
    // 2) from filename hint if we have one
    extFromUri(fileNameHint || "") ||
    // 3) from uri
    extFromUri(decoded);

  // default fallback: if we STILL don't know, assume pdf only when mime says so, else bin
  const finalExt =
    inferredExt || (mime?.toLowerCase().includes("pdf") ? "pdf" : "bin");

  // אם זה כבר קובץ שלנו, אבל בלי סיומת — נתקן ע"י יצירת עותק עם סיומת.
  const isInOurDir = decoded.startsWith("file://") && decoded.includes(dir);

  const alreadyHasExt = !!extFromUri(decoded);

  if (isInOurDir && alreadyHasExt) {
    return decoded;
  }

  const dest = `${dir}incoming_${Date.now()}.${finalExt}`;

  try {
    await FileSystem.copyAsync({ from: decoded, to: dest });
    return dest;
  } catch (e: any) {
    if (isPermissionError(e)) {
      throw new IncomingFilePermissionError(String(e?.message || e));
    }
    throw e;
  }
}
