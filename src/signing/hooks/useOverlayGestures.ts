// src/signing/hooks/useOverlayGestures.ts
import { useMemo, useState } from "react";
import {
  clamp,
  clampPosInsideBox,
  clampPosLoose,
  dist,
  type Point,
  type Rect,
} from "../geometry";

export type ActiveTarget = "sig" | "name1" | "name2" | null;

type UseOverlayGesturesArgs = {
  imageBox: Rect | null;
  isDisabled?: boolean;

  // signature
  sigSize: { w: number; h: number };
  setSigSize: (v: { w: number; h: number }) => void;
  sigPos: Point;
  setSigPos: (p: Point) => void;
  minSigW: number;
  maxSigW: number;

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
  minFont: number;
  maxFont: number;

  // clamp padding for text
  textClampPadding?: number;
};

export function useOverlayGestures({
  imageBox,
  isDisabled,
  sigSize,
  setSigSize,
  sigPos,
  setSigPos,
  minSigW,
  maxSigW,

  name1Pos,
  setName1Pos,
  name1Font,
  setName1Font,

  name2Pos,
  setName2Pos,
  name2Font,
  setName2Font,

  minFont,
  maxFont,

  textClampPadding = 40,
}: UseOverlayGesturesArgs) {
  const [active, setActive] = useState<ActiveTarget>(null);

  const [drag, setDrag] = useState<{
    isDragging: boolean;
    startTouch: Point; // page coords
    startPos: Point; // overlay coords (imageBox coords)
    target: ActiveTarget;
  }>({
    isDragging: false,
    startTouch: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    target: null,
  });

  const [pinch, setPinch] = useState<{
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

  const getTargetPos = (t: ActiveTarget): Point => {
    if (t === "sig") return sigPos;
    if (t === "name1") return name1Pos;
    if (t === "name2") return name2Pos;
    return { x: 0, y: 0 };
  };

  const setTargetPos = (t: ActiveTarget, p: Point) => {
    if (t === "sig") setSigPos(p);
    else if (t === "name1") setName1Pos(p);
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

  const onOverlayGrant = (target: ActiveTarget) => (evt: any) => {
    if (isDisabled) return;
    setActive(target);

    const touches = evt.nativeEvent.touches ?? [];
    if (touches.length >= 2) {
      setPinch({
        isPinching: true,
        startDist: dist(touches[0], touches[1]),
        startSigSize: { w: sigSize.w, h: sigSize.h },
        startPos: getTargetPos(target),
        startFont: getTargetFont(target),
        target,
      });
      setDrag((d) => ({ ...d, isDragging: false, target: null }));
      return;
    }

    const { pageX, pageY } = evt.nativeEvent;
    setDrag({
      isDragging: true,
      startTouch: { x: pageX, y: pageY },
      startPos: getTargetPos(target),
      target,
    });

    setPinch((p) => ({ ...p, isPinching: false, target: null }));
  };

  const onOverlayMove = (evt: any) => {
    if (isDisabled) return;
    if (!imageBox) return;

    const touches = evt.nativeEvent.touches ?? [];

    // pinch
    if (touches.length >= 2) {
      const target = pinch.target ?? drag.target ?? active;
      if (!target) return;

      if (!pinch.isPinching) {
        setPinch({
          isPinching: true,
          startDist: dist(touches[0], touches[1]),
          startSigSize: { w: sigSize.w, h: sigSize.h },
          startPos: getTargetPos(target),
          startFont: getTargetFont(target),
          target,
        });
        setDrag((d) => ({ ...d, isDragging: false, target: null }));
        return;
      }

      const d = dist(touches[0], touches[1]);
      const scale = pinch.startDist > 0 ? d / pinch.startDist : 1;

      if (pinch.target === "sig") {
        let nextW = clamp(pinch.startSigSize.w * scale, minSigW, maxSigW);
        const ratio =
          pinch.startSigSize.w > 0
            ? pinch.startSigSize.h / pinch.startSigSize.w
            : 0.5;
        const nextH = nextW * ratio;

        setSigSize({ w: nextW, h: nextH });
        setSigPos(clampPosInsideBox(pinch.startPos, imageBox, nextW, nextH));
        return;
      }

      if (pinch.target === "name1" || pinch.target === "name2") {
        const nextFont = clamp(pinch.startFont * scale, minFont, maxFont);
        setTargetFont(pinch.target, nextFont);
        return;
      }

      return;
    }

    // drag
    if (!drag.isDragging || !drag.target) return;

    const { pageX, pageY } = evt.nativeEvent;
    const dx = pageX - drag.startTouch.x;
    const dy = pageY - drag.startTouch.y;

    const next = { x: drag.startPos.x + dx, y: drag.startPos.y + dy };

    if (drag.target === "sig") {
      setSigPos(clampPosInsideBox(next, imageBox, sigSize.w, sigSize.h));
      return;
    }

    setTargetPos(drag.target, clampPosLoose(next, imageBox, textClampPadding));
  };

  const onOverlayEnd = () => {
    setDrag((d) => ({ ...d, isDragging: false, target: null }));
    setPinch((p) => ({ ...p, isPinching: false, target: null }));
    setActive(null);
  };

  const isInteractingSig =
    (drag.isDragging && drag.target === "sig") ||
    (pinch.isPinching && pinch.target === "sig");
  const isInteractingName1 =
    (drag.isDragging && drag.target === "name1") ||
    (pinch.isPinching && pinch.target === "name1");
  const isInteractingName2 =
    (drag.isDragging && drag.target === "name2") ||
    (pinch.isPinching && pinch.target === "name2");

  return useMemo(
    () => ({
      active,
      drag,
      pinch,
      onOverlayGrant,
      onOverlayMove,
      onOverlayEnd,
      isInteractingSig,
      isInteractingName1,
      isInteractingName2,
    }),
    [
      active,
      drag,
      pinch,
      isInteractingSig,
      isInteractingName1,
      isInteractingName2,
      imageBox,
      isDisabled,
      sigSize.w,
      sigSize.h,
      sigPos.x,
      sigPos.y,
      name1Pos.x,
      name1Pos.y,
      name2Pos.x,
      name2Pos.y,
      name1Font,
      name2Font,
      minSigW,
      maxSigW,
      minFont,
      maxFont,
      textClampPadding,
    ],
  );
}
