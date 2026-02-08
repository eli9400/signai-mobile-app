import { useCallback, useEffect, type MutableRefObject } from "react";
import * as Linking from "expo-linking";
import { useShareIntentContext } from "expo-share-intent";
import { cacheIncomingUri, IncomingFilePermissionError } from "../utils/incomingFile";
import { detectKindFromUri } from "./detectKindFromUri";
import type { OpenKind, Screen } from "./types";

const isAuthRedirect = (url: string) => {
  const lower = (url || "").toLowerCase();
  if (!lower) return false;
  if (lower.startsWith("http")) return false;
  return lower.includes("oauthredirect");
};

type Args = {
  setScreen: (s: Screen) => void;
  setOpenUri: (uri: string | null) => void;
  setOpenKind: (kind: OpenKind | null) => void;
  setHasLoadedFile: (v: boolean) => void;
  handledIncomingRef: MutableRefObject<boolean>;
};

export function useIncomingRouting({
  setScreen,
  setOpenUri,
  setOpenKind,
  setHasLoadedFile,
  handledIncomingRef,
}: Args) {
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  const routeIncoming = useCallback(
    (uri: string, kind?: OpenKind, mime?: string) => {
      const decoded = decodeURI(uri);
      const finalKind: OpenKind =
        kind ??
        (mime === "application/pdf"
          ? "pdf"
          : mime?.startsWith("image/")
            ? "image"
            : detectKindFromUri(decoded));

      handledIncomingRef.current = true;

      setOpenUri(decoded);
      setOpenKind(finalKind);
      setHasLoadedFile(true);
      setScreen(finalKind === "pdf" ? "signPdf" : "signImage");
    },
    [handledIncomingRef, setHasLoadedFile, setOpenKind, setOpenUri, setScreen],
  );

  const prepareAndRouteIncoming = useCallback(
    async (
      uri: string,
      kind?: OpenKind,
      mime?: string,
      source?: "shareIntent" | "linking",
      fileNameHint?: string,
    ) => {
      const decoded = decodeURI(uri);
      const finalKind: OpenKind =
        kind ??
        (mime === "application/pdf"
          ? "pdf"
          : mime?.startsWith("image/")
            ? "image"
            : detectKindFromUri(decoded));

      console.log(`[incoming] ${source ?? "incoming"}: copying to cache...`, decoded);

      try {
        const localUri = await cacheIncomingUri(decoded, mime, fileNameHint);
        console.log(`[incoming] ${source ?? "incoming"}: cached local:`, localUri);
        routeIncoming(localUri, finalKind, mime);
      } catch (e: any) {
        const msg = String(e?.message || e);

        if (e instanceof IncomingFilePermissionError) {
          console.log(
            `[incoming] ${source ?? "incoming"}: no permission to read content:// (picker fallback needed):`,
            msg,
          );
        } else {
          console.log(
            `[incoming] ${source ?? "incoming"}: cache failed, trying original URI:`,
            msg,
          );
        }

        routeIncoming(decoded, finalKind, mime);
      }
    },
    [routeIncoming],
  );

  useEffect(() => {
    if (!hasShareIntent) return;

    try {
      console.log("[incoming] shareIntent raw:", JSON.stringify(shareIntent, null, 2));
    } catch {
      console.log("[incoming] shareIntent raw (non-serializable):", shareIntent);
    }

    const files = (shareIntent as any)?.files ?? [];
    const first = files[0];

    const uri: string | null =
      first?.path ?? first?.uri ?? first?.fileUri ?? first?.contentUri ?? null;

    const mime: string = String(
      first?.mimeType ?? first?.mime ?? (shareIntent as any)?.mimeType ?? "",
    ).toLowerCase();

    console.log("[incoming] share/open parsed:", {
      uri,
      mime,
      filesCount: files.length,
    });

    if (!uri) return;

    const kind: OpenKind =
      mime === "application/pdf"
        ? "pdf"
        : mime?.startsWith("image/")
          ? "image"
          : detectKindFromUri(uri);

    prepareAndRouteIncoming(uri, kind, mime, "shareIntent", first?.fileName);

    setTimeout(() => {
      try {
        resetShareIntent();
      } catch {}
    }, 2000);
  }, [hasShareIntent, prepareAndRouteIncoming, resetShareIntent, shareIntent]);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (!url) return;
      if (url.startsWith("exp://") || url.startsWith("expo://")) return;
      if (isAuthRedirect(url)) return;
      if (handledIncomingRef.current) return;

      console.log("[incoming] handleUrl:", url);
      prepareAndRouteIncoming(url, undefined, undefined, "linking");
    };

    Linking.getInitialURL().then((initialUrl: string | null) => {
      console.log("[incoming] initialUrl:", initialUrl);
      if (initialUrl) handleUrl(initialUrl);
    });

    const sub = Linking.addEventListener("url", ({ url }: { url: string }) => {
      console.log("[incoming] url event:", url);
      handleUrl(url);
    });

    return () => {
      // @ts-ignore older RN types
      sub?.remove?.();
    };
  }, [handledIncomingRef, prepareAndRouteIncoming]);
}
