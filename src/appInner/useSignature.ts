import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { loadSignaturePngUri, type SignatureScope } from "../storage/signatureStore";
import type { Screen } from "./types";

type Args = {
  screen: Screen;
  user: User | null;
  isGuest: boolean;
};

export function useSignature({ screen, user, isGuest }: Args) {
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  const signatureScope: SignatureScope | null = useMemo(() => {
    if (user) return { kind: "user", userId: user.uid };
    if (isGuest) return { kind: "guest" };
    return null;
  }, [isGuest, user]);

  useEffect(() => {
    let active = true;

    if (signatureScope) {
      (async () => {
        const uri = await loadSignaturePngUri(signatureScope);
        if (active) setSignatureUri(uri);
      })();
    } else {
      setSignatureUri(null);
    }

    return () => {
      active = false;
    };
  }, [screen, signatureScope]);

  return { signatureUri, setSignatureUri, signatureScope };
}
