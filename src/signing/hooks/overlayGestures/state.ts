import { useRef, useState, type MutableRefObject } from "react";
import type { ActiveTarget } from "./types";
import type { Point } from "../../geometry";

export type DragState = { isDragging: boolean; target: ActiveTarget };
export type PinchState = { isPinching: boolean; target: ActiveTarget };

export type DragRef = {
  isDragging: boolean;
  startTouch: Point;
  startPos: Point;
  target: ActiveTarget;
};

export type PinchRef = {
  isPinching: boolean;
  startDist: number;
  startSigSize: { w: number; h: number };
  startPos: Point;
  startFont: number;
  target: ActiveTarget;
};

export type OverlayGestureState = {
  active: ActiveTarget;
  setActive: (t: ActiveTarget) => void;
  activeRef: MutableRefObject<ActiveTarget>;
  dragState: DragState;
  setDragState: (s: DragState) => void;
  pinchState: PinchState;
  setPinchState: (s: PinchState) => void;
  dragRef: MutableRefObject<DragRef>;
  pinchRef: MutableRefObject<PinchRef>;
};

export function useOverlayGestureState(): OverlayGestureState {
  const [active, setActive] = useState<ActiveTarget>(null);
  const activeRef = useRef<ActiveTarget>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    target: null,
  });
  const [pinchState, setPinchState] = useState<PinchState>({
    isPinching: false,
    target: null,
  });

  const dragRef = useRef<DragRef>({
    isDragging: false,
    startTouch: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    target: null,
  });

  const pinchRef = useRef<PinchRef>({
    isPinching: false,
    startDist: 0,
    startSigSize: { w: 0, h: 0 },
    startPos: { x: 0, y: 0 },
    startFont: 0,
    target: null,
  });

  return {
    active,
    setActive,
    activeRef,
    dragState,
    setDragState,
    pinchState,
    setPinchState,
    dragRef,
    pinchRef,
  };
}
