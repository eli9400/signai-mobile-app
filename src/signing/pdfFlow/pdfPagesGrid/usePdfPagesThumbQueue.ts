import { useCallback, useEffect, useRef, useState } from "react";

type Args = {
  pdfReady: boolean;
  pdfBase64?: string;
  totalPages: number;
  pages: number[];
  thumbnails: Record<number, string>;
  setThumbnails: React.Dispatch<React.SetStateAction<Record<number, string>>>;
};

export function usePdfPagesThumbQueue({
  pdfReady,
  pdfBase64,
  totalPages,
  pages,
  thumbnails,
  setThumbnails,
}: Args) {
  const queueRef = useRef<number[]>([]);
  const renderingRef = useRef(false);
  const [renderPage, setRenderPage] = useState<number | null>(null);

  useEffect(() => {
    queueRef.current = [];
    renderingRef.current = false;
    setRenderPage(null);
  }, [pdfBase64]);

  const enqueuePages = useCallback(
    (pageNums: number[]) => {
      if (!pdfBase64) return;

      const next = [...queueRef.current];
      for (const p of pageNums) {
        if (p < 1 || p > totalPages) continue;
        if (thumbnails[p]) continue;
        if (next.includes(p)) continue;
        next.push(p);
      }
      queueRef.current = next;

      if (!renderingRef.current) {
        const first = queueRef.current.shift();
        if (first) {
          renderingRef.current = true;
          setRenderPage(first);
        }
      }
    },
    [pdfBase64, totalPages, thumbnails],
  );

  useEffect(() => {
    if (!pdfReady || totalPages <= 0) return;
    enqueuePages(pages.slice(0, 6));
  }, [pdfReady, totalPages, enqueuePages, pages]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const visible: number[] = [];
    for (const vi of viewableItems) {
      const p = vi?.item;
      if (typeof p === "number") visible.push(p);
    }

    const extra: number[] = [];
    for (const p of visible) {
      for (let k = 0; k < 4; k++) extra.push(p + k);
    }
    enqueuePages([...visible, ...extra]);
  }).current;

  const onEndReached = useCallback(() => {
    if (!totalPages) return;

    const loadedNums = Object.keys(thumbnails)
      .map((x) => Number(x))
      .filter(Boolean);
    const maxLoaded = loadedNums.length ? Math.max(...loadedNums) : 0;

    const start = Math.max(1, maxLoaded + 1);
    const nextBatch: number[] = [];
    for (let p = start; p <= Math.min(totalPages, start + 12); p++) {
      nextBatch.push(p);
    }

    enqueuePages(nextBatch);
  }, [enqueuePages, thumbnails, totalPages]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 80,
  }).current;

  const advanceQueue = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    if (next) {
      setRenderPage(next);
    } else {
      renderingRef.current = false;
      setRenderPage(null);
    }
  }, []);

  const onThumbRendered = useCallback(
    (dataUrl: string) => {
      if (!renderPage) return;
      setThumbnails((prev) => ({
        ...prev,
        [renderPage]: String(dataUrl),
      }));
      advanceQueue();
    },
    [advanceQueue, renderPage, setThumbnails],
  );

  const onThumbError = useCallback(() => {
    advanceQueue();
  }, [advanceQueue]);

  return {
    renderPage,
    onViewableItemsChanged,
    onEndReached,
    viewabilityConfig,
    onThumbRendered,
    onThumbError,
  };
}
