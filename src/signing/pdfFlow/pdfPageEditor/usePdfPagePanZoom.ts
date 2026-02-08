import { useCallback, useRef, useState, type MutableRefObject } from "react";
import { clamp, dist } from "../../geometry";

type TouchEvent = {
  nativeEvent: {
    touches?: Array<{ pageX: number; pageY: number }>;
    pageX?: number;
    pageY?: number;
  };
};

export function usePdfPagePanZoom(
  isOverlayInteractingRef: MutableRefObject<boolean>,
) {
  const [pageScale, setPageScale] = useState(1);
  const [pageTx, setPageTx] = useState(0);
  const [pageTy, setPageTy] = useState(0);

  const pinchRef = useRef({
    isPinching: false,
    startDist: 0,
    startScale: 1,
  });

  const panRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  const resetZoom = useCallback(() => {
    setPageScale(1);
    setPageTx(0);
    setPageTy(0);
    pinchRef.current.isPinching = false;
    panRef.current.isPanning = false;
  }, []);

  const onStageStart = useCallback(
    (evt: TouchEvent) => {
      if (isOverlayInteractingRef.current) return;

      const touches = evt.nativeEvent.touches ?? [];
      if (touches.length >= 2) {
        pinchRef.current = {
          isPinching: true,
          startDist: dist(touches[0], touches[1]),
          startScale: pageScale,
        };
        panRef.current.isPanning = false;
        return;
      }

      if (touches.length === 1 && pageScale > 1.02) {
        const { pageX = 0, pageY = 0 } = evt.nativeEvent;
        panRef.current = {
          isPanning: true,
          startX: pageX,
          startY: pageY,
          startTx: pageTx,
          startTy: pageTy,
        };
        pinchRef.current.isPinching = false;
      }
    },
    [isOverlayInteractingRef, pageScale, pageTx, pageTy],
  );

  const onStageMove = useCallback(
    (evt: TouchEvent) => {
      if (isOverlayInteractingRef.current) return;

      const touches = evt.nativeEvent.touches ?? [];
      if (touches.length >= 2) {
        if (!pinchRef.current.isPinching) {
          pinchRef.current = {
            isPinching: true,
            startDist: dist(touches[0], touches[1]),
            startScale: pageScale,
          };
          panRef.current.isPanning = false;
          return;
        }

        const d = dist(touches[0], touches[1]);
        const base = pinchRef.current.startDist || 1;
        const ratio = d / base;

        const nextScale = clamp(pinchRef.current.startScale * ratio, 1, 3);
        setPageScale(nextScale);

        if (nextScale <= 1.02) {
          setPageTx(0);
          setPageTy(0);
        }
        return;
      }

      if (touches.length === 1 && pageScale > 1.02) {
        if (!panRef.current.isPanning) {
          const { pageX = 0, pageY = 0 } = evt.nativeEvent;
          panRef.current = {
            isPanning: true,
            startX: pageX,
            startY: pageY,
            startTx: pageTx,
            startTy: pageTy,
          };
          return;
        }

        const { pageX = 0, pageY = 0 } = evt.nativeEvent;
        const dx = pageX - panRef.current.startX;
        const dy = pageY - panRef.current.startY;

        setPageTx(panRef.current.startTx + dx);
        setPageTy(panRef.current.startTy + dy);
      }
    },
    [isOverlayInteractingRef, pageScale, pageTx, pageTy],
  );

  const onStageEnd = useCallback(() => {
    pinchRef.current.isPinching = false;
    panRef.current.isPanning = false;
    if (pageScale <= 1.02) resetZoom();
  }, [pageScale, resetZoom]);

  return {
    pageScale,
    pageTx,
    pageTy,
    setPageScale,
    setPageTx,
    setPageTy,
    resetZoom,
    onStageStart,
    onStageMove,
    onStageEnd,
  };
}
