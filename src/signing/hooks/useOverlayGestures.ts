// src/signing/hooks/useOverlayGestures.ts
import {
  useMemo,
  useState,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  clamp,
  clampPosInsideBox,
  clampPosLoose,
  dist,
  type Point,
  type Rect,
} from "../geometry";

type Size = { w: number; h: number };
export type SigItem = { id: string; pos: Point; size: Size };

export type ActiveTarget =
  | { kind: "sig"; id: string }
  | "name1"
  | "name2"
  | null;

type UseOverlayGesturesArgs = {
  imageBox: Rect | null;
  isDisabled?: boolean;
  isPinchEnabled?: boolean;

  // signatures (multi)
  sigItems: SigItem[];
  setSigItems: Dispatch<SetStateAction<SigItem[]>>;
  activeSigId: string | null;
  setActiveSigId: (id: string | null) => void;

  minSigW?: number;
  maxSigW?: number;

  // text 1
  name1Pos: Point;
  setName1Pos: (p: Point) => void;
  name1Font: number;
  setName1Font: (n: number) => void;

  // text 2
  name2Pos: Point;
  setName2Pos: (p: Point) => void;
  name2Font: number;
  setName2Font: (n: number) => void;

  // font bounds
  minFont?: number;
  maxFont?: number;

  // clamp padding for text
  textClampPadding?: number;

  // callbacks for parent to know when overlay is interacting
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;

  // parent's page scale for coordinate correction
  pageScale?: number;
};

const DEFAULT_MIN_SIG_W = 50;
const DEFAULT_MAX_SIG_W = 600;
const DEFAULT_MIN_FONT = 8;
const DEFAULT_MAX_FONT = 100;

export function useOverlayGestures({
  imageBox,
  isDisabled,

  sigItems,
  setSigItems,
  activeSigId,
  setActiveSigId,

  minSigW = DEFAULT_MIN_SIG_W,
  maxSigW = DEFAULT_MAX_SIG_W,

  name1Pos,
  setName1Pos,
  name1Font,
  setName1Font,

  name2Pos,
  setName2Pos,
  name2Font,
  setName2Font,

  minFont = DEFAULT_MIN_FONT,
  maxFont = DEFAULT_MAX_FONT,

  isPinchEnabled = true,
  textClampPadding = 40,

  onInteractionStart,
  onInteractionEnd,

  pageScale = 1,
}: UseOverlayGesturesArgs) {
  // UI-only state (for borders / debug)
  const [active, setActive] = useState<ActiveTarget>(null);
  const activeRef = useRef<ActiveTarget>(null);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    target: ActiveTarget;
  }>({ isDragging: false, target: null });

  const [pinchState, setPinchState] = useState<{
    isPinching: boolean;
    target: ActiveTarget;
  }>({ isPinching: false, target: null });

  // runtime refs (SYNC, reliable for gesture math)
  const dragRef = useRef<{
    isDragging: boolean;
    startTouch: Point;
    startPos: Point;
    target: ActiveTarget;
  }>({
    isDragging: false,
    startTouch: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    target: null,
  });

  const pinchRef = useRef<{
    isPinching: boolean;
    startDist: number;
    startSigSize: { w: number; h: number };
    startPos: Point;
    startFont: number;
    target: ActiveTarget;
  }>({
    isPinching: false,
    startDist: 0,
    startSigSize: { w: 0, h: 0 },
    startPos: { x: 0, y: 0 },
    startFont: 0,
    target: null,
  });

  const findSig = (id: string | null | undefined) => {
    if (!id) return null;
    return sigItems.find((s) => s.id === id) ?? null;
  };

  const isSigTarget = (t: ActiveTarget): t is { kind: "sig"; id: string } =>
    Boolean(t && typeof t === "object" && (t as any).kind === "sig");

  const getTargetPos = (t: ActiveTarget): Point => {
    if (isSigTarget(t)) return findSig(t.id)?.pos ?? { x: 0, y: 0 };
    if (t === "name1") return name1Pos;
    if (t === "name2") return name2Pos;
    return { x: 0, y: 0 };
  };

  const setTargetPos = (t: ActiveTarget, p: Point) => {
    if (isSigTarget(t)) {
      const id = t.id;
      setSigItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, pos: p } : s)),
      );
      return;
    }
    if (t === "name1") setName1Pos(p);
    else if (t === "name2") setName2Pos(p);
  };

  const getTargetFont = (t: ActiveTarget): number => {
    if (t === "name1") return name1Font;
    if (t === "name2") return name2Font;
    return 0;
  };

  const setTargetFont = (t: ActiveTarget, v: number) => {
    if (t === "name1") setName1Font(v);
    else if (t === "name2") setName2Font(v);
  };

  const getSigSizeForTarget = (t: ActiveTarget): { w: number; h: number } => {
    if (isSigTarget(t)) return findSig(t.id)?.size ?? { w: 0, h: 0 };
    return { w: 0, h: 0 };
  };

  const setSigSizeForId = (id: string, nextSize: { w: number; h: number }) => {
    setSigItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, size: nextSize } : s)),
    );
  };

  const setSigPosForId = (id: string, nextPos: Point) => {
    setSigItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pos: nextPos } : s)),
    );
  };

  const resolvePinchTarget = (): ActiveTarget => {
    // best effort in order
    const t =
      pinchRef.current.target ?? dragRef.current.target ?? activeRef.current;
    if (t) return t;

    // fallback: if user already has activeSigId, allow pinch to resize it
    if (activeSigId) return { kind: "sig", id: activeSigId };

    return null;
  };

  const onOverlayGrant = (target: ActiveTarget) => (evt: any) => {
    if (isDisabled) return;

    // make sig active
    if (isSigTarget(target)) setActiveSigId(target.id);

    setActive(target);
    activeRef.current = target;

    onInteractionStart?.();

    const touches = evt.nativeEvent.touches ?? [];

    // pinch start (2 fingers already)
    if (isPinchEnabled && touches.length >= 2) {
      const sigSizeNow = getSigSizeForTarget(target);
      pinchRef.current = {
        isPinching: true,
        startDist: dist(touches[0], touches[1]),
        startSigSize: { w: sigSizeNow.w, h: sigSizeNow.h },
        startPos: getTargetPos(target),
        startFont: getTargetFont(target),
        target,
      };
      setPinchState({ isPinching: true, target });
      dragRef.current = { ...dragRef.current, isDragging: false, target: null };
      setDragState({ isDragging: false, target: null });
      return;
    }

    // drag start (1 finger)
    const { pageX, pageY } = evt.nativeEvent;
    dragRef.current = {
      isDragging: true,
      startTouch: { x: pageX, y: pageY },
      startPos: getTargetPos(target),
      target,
    };
    setDragState({ isDragging: true, target });

    pinchRef.current = { ...pinchRef.current, isPinching: false, target: null };
    setPinchState({ isPinching: false, target: null });
  };

  const onOverlayMove = (evt: any) => {
    if (isDisabled) return;
    if (!imageBox) return;

    const touches = evt.nativeEvent.touches ?? [];

    // pinch
    if (isPinchEnabled && touches.length >= 2) {
      const target = resolvePinchTarget();
      if (!target) return;

      // initialize pinch once, sync (no state lag)
      if (!pinchRef.current.isPinching) {
        const sigSizeNow = getSigSizeForTarget(target);
        pinchRef.current = {
          isPinching: true,
          startDist: dist(touches[0], touches[1]),
          startSigSize: { w: sigSizeNow.w, h: sigSizeNow.h },
          startPos: getTargetPos(target),
          startFont: getTargetFont(target),
          target,
        };
        setPinchState({ isPinching: true, target });

        dragRef.current = {
          ...dragRef.current,
          isDragging: false,
          target: null,
        };
        setDragState({ isDragging: false, target: null });
        return;
      }

      const d = dist(touches[0], touches[1]);
      const base = pinchRef.current.startDist || 1;
      const scale = d / base;

      // resize sig
      if (isSigTarget(target)) {
        const id = target.id;

        let nextW = clamp(
          pinchRef.current.startSigSize.w * scale,
          minSigW,
          maxSigW,
        );
        const ratio =
          pinchRef.current.startSigSize.w > 0
            ? pinchRef.current.startSigSize.h / pinchRef.current.startSigSize.w
            : 0.5;
        const nextH = nextW * ratio;

        setSigSizeForId(id, { w: nextW, h: nextH });
        setSigPosForId(
          id,
          clampPosInsideBox(pinchRef.current.startPos, imageBox, nextW, nextH),
        );
        return;
      }

      // resize font
      if (target === "name1" || target === "name2") {
        const nextFont = clamp(
          pinchRef.current.startFont * scale,
          minFont,
          maxFont,
        );
        setTargetFont(target, nextFont);
        return;
      }

      return;
    }

    // drag
    if (!dragRef.current.isDragging || !dragRef.current.target) return;

    const { pageX, pageY } = evt.nativeEvent;

    const dx = (pageX - dragRef.current.startTouch.x) / pageScale;
    const dy = (pageY - dragRef.current.startTouch.y) / pageScale;

    const next = {
      x: dragRef.current.startPos.x + dx,
      y: dragRef.current.startPos.y + dy,
    };

    // drag sig
    if (isSigTarget(dragRef.current.target)) {
      const id = dragRef.current.target.id;
      const s = findSig(id);
      const w = s?.size.w ?? 0;
      const h = s?.size.h ?? 0;

      setSigPosForId(id, clampPosInsideBox(next, imageBox, w, h));
      return;
    }

    // drag text
    setTargetPos(
      dragRef.current.target,
      clampPosLoose(next, imageBox, textClampPadding),
    );
  };

  const onOverlayEnd = () => {
    dragRef.current = { ...dragRef.current, isDragging: false, target: null };
    pinchRef.current = { ...pinchRef.current, isPinching: false, target: null };

    setDragState({ isDragging: false, target: null });
    setPinchState({ isPinching: false, target: null });

    setActive(null);
    activeRef.current = null;

    onInteractionEnd?.();
  };

  const isInteractingSig =
    (dragState.isDragging && isSigTarget(dragState.target)) ||
    (pinchState.isPinching && isSigTarget(pinchState.target));

  const isInteractingName1 =
    (dragState.isDragging && dragState.target === "name1") ||
    (pinchState.isPinching && pinchState.target === "name1");

  const isInteractingName2 =
    (dragState.isDragging && dragState.target === "name2") ||
    (pinchState.isPinching && pinchState.target === "name2");

  return useMemo(
    () => ({
      active,
      drag: dragState,
      pinch: pinchState,
      onOverlayGrant,
      onOverlayMove,
      onOverlayEnd,
      isInteractingSig,
      isInteractingName1,
      isInteractingName2,
    }),
    [
      active,
      dragState,
      pinchState,
      isInteractingSig,
      isInteractingName1,
      isInteractingName2,
      imageBox,
      isDisabled,
      sigItems,
      activeSigId,
      minSigW,
      maxSigW,
      name1Pos.x,
      name1Pos.y,
      name2Pos.x,
      name2Pos.y,
      name1Font,
      name2Font,
      minFont,
      maxFont,
      textClampPadding,
      pageScale,
    ],
  );
}
