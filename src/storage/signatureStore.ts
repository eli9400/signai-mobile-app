import AsyncStorage from "@react-native-async-storage/async-storage";

const SIG_B64_KEY = "signature_png_base64_v1";

/**
 * שומר base64 (בלי prefix של data:image/png;base64,)
 */
export async function saveSignaturePng(base64Png: string) {
  const clean = (base64Png ?? "").trim();
  if (!clean) throw new Error("Empty signature base64");
  await AsyncStorage.setItem(SIG_B64_KEY, clean);
  return `data:image/png;base64,${clean}`;
}

/**
 * מחזיר URI שניתן להציג ישירות ב-Image
 */
export async function loadSignaturePngUri(): Promise<string | null> {
  const b64 = await AsyncStorage.getItem(SIG_B64_KEY);
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}

export async function clearSignature() {
  await AsyncStorage.removeItem(SIG_B64_KEY);
}
