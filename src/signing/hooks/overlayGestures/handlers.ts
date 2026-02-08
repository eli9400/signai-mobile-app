import { clamp, clampPosInsideBox, clampPosLoose, dist, type Point } from "../../geometry";
import type { ActiveTarget, UseOverlayGesturesArgs } from "./types";
import type { OverlayGestureState } from "./state";
import { createTargetOps, isSigTarget, resolvePinchTarget, findSig } from "./targets";
import { DEFAULT_MAX_FONT, DEFAULT_MAX_SIG_W, DEFAULT_MIN_FONT, DEFAULT_MIN_SIG_W } from "./types";
export type OverlayHandlers = {
  onOverlayGrant: (target: ActiveTarget) => (evt: any) => void;
  onOverlayMove: (evt: any) => void;
  onOverlayEnd: () => void;
  isInteractingSig: boolean;
  isInteractingName1: boolean;
  isInteractingName2: boolean;
};
export function useOverlayGestureHandlers(
  args: UseOverlayGesturesArgs,
  state: OverlayGestureState,
): OverlayHandlers {
  const {
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
  } = args;

  const {
    activeRef,
    dragRef,
    pinchRef,
    setActive,
    setDragState,
    setPinchState,
    dragState,
    pinchState,
  } = state;

  const ops = createTargetOps({
    sigItems,
    setSigItems,
    name1Pos,
    setName1Pos,
    name1Font,
    setName1Font,
    name2Pos,
    setName2Pos,
    name2Font,
    setName2Font,
  });

  const onOverlayGrant = (target: ActiveTarget) => (evt: any) => {
    if (isDisabled) return;
    if (isSigTarget(target)) setActiveSigId(target.id);
    setActive(target);
    activeRef.current = target;
    onInteractionStart?.();

    const touches = evt.nativeEvent.touches ?? [];
    if (isPinchEnabled && touches.length >= 2) {
      const sigSizeNow = ops.getSigSizeForTarget(target);
      pinchRef.current = {
        isPinching: true,
        startDist: dist(touches[0], touches[1]),
        startSigSize: { w: sigSizeNow.w, h: sigSizeNow.h },
        startPos: ops.getTargetPos(target),
        startFont: ops.getTargetFont(target),
        target,
      };
      setPinchState({ isPinching: true, target });
      dragRef.current = { ...dragRef.current, isDragging: false, target: null };
      setDragState({ isDragging: false, target: null });
      return;
    }

    const { pageX, pageY } = evt.nativeEvent;
    dragRef.current = {
      isDragging: true,
      startTouch: { x: pageX, y: pageY },
      startPos: ops.getTargetPos(target),
      target,
    };
    setDragState({ isDragging: true, target });
    pinchRef.current = { ...pinchRef.current, isPinching: false, target: null };
    setPinchState({ isPinching: false, target: null });
  };

  const onOverlayMove = (evt: any) => {
    if (isDisabled || !imageBox) return;
    const touches = evt.nativeEvent.touches ?? [];

    if (isPinchEnabled && touches.length >= 2) {
      const target = resolvePinchTarget(
        pinchRef.current.target,
        dragRef.current.target,
        activeRef.current,
        activeSigId,
      );
      if (!target) return;

      if (!pinchRef.current.isPinching) {
        const sigSizeNow = ops.getSigSizeForTarget(target);
        pinchRef.current = {
          isPinching: true,
          startDist: dist(touches[0], touches[1]),
          startSigSize: { w: sigSizeNow.w, h: sigSizeNow.h },
          startPos: ops.getTargetPos(target),
          startFont: ops.getTargetFont(target),
          target,
        };
        setPinchState({ isPinching: true, target });
        dragRef.current = { ...dragRef.current, isDragging: false, target: null };
        setDragState({ isDragging: false, target: null });
        return;
      }

      const d = dist(touches[0], touches[1]);
      const base = pinchRef.current.startDist || 1;
      const scale = d / base;

      if (isSigTarget(target)) {
        const id = target.id;
        let nextW = clamp(pinchRef.current.startSigSize.w * scale, minSigW, maxSigW);
        const ratio =
          pinchRef.current.startSigSize.w > 0
            ? pinchRef.current.startSigSize.h / pinchRef.current.startSigSize.w
            : 0.5;
        const nextH = nextW * ratio;

        ops.setSigSizeForId(id, { w: nextW, h: nextH });
        ops.setSigPosForId(
          id,
          clampPosInsideBox(pinchRef.current.startPos, imageBox, nextW, nextH),
        );
        return;
      }

      if (target === "name1" || target === "name2") {
        const nextFont = clamp(pinchRef.current.startFont * scale, minFont, maxFont);
        ops.setTargetFont(target, nextFont);
        return;
      }
      return;
    }

    if (!dragRef.current.isDragging || !dragRef.current.target) return;
    const { pageX, pageY } = evt.nativeEvent;
    const scale = Math.abs(pageScale) || 1;
    const dx = (pageX - dragRef.current.startTouch.x) / scale;
    const dy = (pageY - dragRef.current.startTouch.y) / scale;
    const next: Point = {
      x: dragRef.current.startPos.x + dx,
      y: dragRef.current.startPos.y + dy,
    };

    if (isSigTarget(dragRef.current.target)) {
      const id = dragRef.current.target.id;
      const s = findSig(sigItems, id);
      const w = s?.size.w ?? 0;
      const h = s?.size.h ?? 0;
      ops.setSigPosForId(id, clampPosInsideBox(next, imageBox, w, h));
      return;
    }

    ops.setTargetPos(
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

  return {
    onOverlayGrant,
    onOverlayMove,
    onOverlayEnd,
    isInteractingSig,
    isInteractingName1,
    isInteractingName2,
  };
}
