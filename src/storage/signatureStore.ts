import AsyncStorage from "@react-native-async-storage/async-storage";

const SIG_B64_KEY = "signature_png_base64_v1";
const SIG_B64_KEY_PREFIX = "signature_png_base64_v1";

export type SignatureScope =
  | { kind: "user"; userId: string }
  | { kind: "guest" };

const buildKey = (scope: SignatureScope) =>
  scope.kind === "guest"
    ? `${SIG_B64_KEY_PREFIX}:guest`
    : `${SIG_B64_KEY_PREFIX}:user:${scope.userId}`;

async function loadSignatureBase64(scope: SignatureScope): Promise<string | null> {
  const key = buildKey(scope);
  const current = await AsyncStorage.getItem(key);
  if (current) return current;

  if (scope.kind === "user") {
    const legacy = await AsyncStorage.getItem(SIG_B64_KEY);
    if (legacy) {
      await AsyncStorage.setItem(key, legacy);
      await AsyncStorage.removeItem(SIG_B64_KEY);
      return legacy;
    }
  }

  return null;
}

/**
 * שומר base64 (בלי prefix של data:image/png;base64,)
 */
export async function saveSignaturePng(
  base64Png: string,
  scope: SignatureScope,
) {
  const clean = (base64Png ?? "").trim();
  if (!clean) throw new Error("Empty signature base64");
  await AsyncStorage.setItem(buildKey(scope), clean);
  if (scope.kind === "user") {
    await AsyncStorage.removeItem(SIG_B64_KEY);
  }
  return `data:image/png;base64,${clean}`;
}

/**
 * מחזיר URI שניתן להציג ישירות ב-Image
 */
export async function loadSignaturePngUri(
  scope: SignatureScope,
): Promise<string | null> {
  const b64 = await loadSignatureBase64(scope);
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}

export async function clearSignature(scope: SignatureScope) {
  await AsyncStorage.removeItem(buildKey(scope));
  if (scope.kind === "user") {
    await AsyncStorage.removeItem(SIG_B64_KEY);
  }
}
