import { useMemo } from "react";
import { useOverlayGestureState } from "./state";
import { useOverlayGestureHandlers } from "./handlers";
import type { UseOverlayGesturesArgs } from "./types";

export function useOverlayGestures(args: UseOverlayGesturesArgs) {
  const state = useOverlayGestureState();
  const handlers = useOverlayGestureHandlers(args, state);

  return useMemo(
    () => ({
      active: state.active,
      drag: state.dragState,
      pinch: state.pinchState,
      onOverlayGrant: handlers.onOverlayGrant,
      onOverlayMove: handlers.onOverlayMove,
      onOverlayEnd: handlers.onOverlayEnd,
      isInteractingSig: handlers.isInteractingSig,
      isInteractingName1: handlers.isInteractingName1,
      isInteractingName2: handlers.isInteractingName2,
    }),
    [
      state.active,
      state.dragState,
      state.pinchState,
      handlers.onOverlayGrant,
      handlers.onOverlayMove,
      handlers.onOverlayEnd,
      handlers.isInteractingSig,
      handlers.isInteractingName1,
      handlers.isInteractingName2,
    ],
  );
}
