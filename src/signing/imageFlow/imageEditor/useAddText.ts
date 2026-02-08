import { useCallback, useState } from "react";
import type React from "react";
import type { ImageEditState } from "../../../screens/signImage/signImageState";
import type { TextTarget } from "./types";

type Args = {
  nextTextTarget: TextTarget;
  setEditState: React.Dispatch<React.SetStateAction<ImageEditState>>;
};

export function useAddText({ nextTextTarget, setEditState }: Args) {
  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addTextValue, setAddTextValue] = useState("");

  const openAddText = useCallback(() => {
    if (!nextTextTarget) return;
    setAddTextValue("");
    setAddTextOpen(true);
  }, [nextTextTarget]);

  const cancelAddText = useCallback(() => {
    setAddTextOpen(false);
  }, []);

  const confirmAddText = useCallback(() => {
    const txt = (addTextValue ?? "").trim();
    if (!txt || !nextTextTarget) {
      setAddTextOpen(false);
      return;
    }

    if (nextTextTarget === "name1") {
      setEditState((prev) => ({
        ...prev,
        name1: txt,
        name1Pos: { x: 24, y: 160 },
        name1Font: 30,
      }));
    } else {
      setEditState((prev) => ({
        ...prev,
        name2: txt,
        name2Pos: { x: 24, y: 240 },
        name2Font: 30,
      }));
    }

    setAddTextOpen(false);
  }, [addTextValue, nextTextTarget, setEditState]);

  return {
    addTextOpen,
    addTextValue,
    setAddTextValue,
    openAddText,
    cancelAddText,
    confirmAddText,
  };
}
