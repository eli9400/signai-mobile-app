import * as FileSystem from "expo-file-system/legacy";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Base64 helpers (Expo/RN usually have atob/btoa)
export const base64ToUint8 = (b64: string) => {
  const bin = globalThis.atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

export const uint8ToBase64 = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return globalThis.btoa(bin);
};

export function extractBase64FromDataUrl(
  dataUrl: string,
  invalidMsg: string,
) {
  // data:image/png;base64,AAAA...
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) throw new Error(invalidMsg);
  return dataUrl.slice(idx + "base64,".length);
}

export async function readUriAsBase64(
  uriOrDataUrl: string,
  opts: { emptyMsg: string; invalidDataUrlMsg: string },
) {
  if (!uriOrDataUrl) throw new Error(opts.emptyMsg);

  // If it's already a data URL, just extract base64 directly
  if (uriOrDataUrl.startsWith("data:")) {
    return extractBase64FromDataUrl(uriOrDataUrl, opts.invalidDataUrlMsg);
  }

  // Otherwise, assume it's a file uri (file://, content:// etc.)
  return FileSystem.readAsStringAsync(uriOrDataUrl, {
    encoding: "base64" as any,
  });
}
