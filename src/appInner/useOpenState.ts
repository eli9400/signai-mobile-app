import { useCallback, useRef, useState } from "react";
import type { OpenKind } from "./types";

export function useOpenState() {
  const [openUri, setOpenUri] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<OpenKind | null>(null);
  const [hasLoadedFile, setHasLoadedFile] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const handledIncomingRef = useRef(false);

  const clearOpen = useCallback(() => {
    handledIncomingRef.current = false;
    setOpenUri(null);
    setOpenKind(null);
    setHasLoadedFile(false);
    setUseCamera(false);
  }, []);

  return {
    openUri,
    setOpenUri,
    openKind,
    setOpenKind,
    hasLoadedFile,
    setHasLoadedFile,
    useCamera,
    setUseCamera,
    handledIncomingRef,
    clearOpen,
  };
}
