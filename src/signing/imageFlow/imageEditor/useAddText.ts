import { useCallback, useState } from "react";
import type React from "react";
import type { ImageEditState } from "../../../screens/signImage/signImageState";

type Args = {
  setEditState: React.Dispatch<React.SetStateAction<ImageEditState>>;
};

export function useAddText({ setEditState }: Args) {
  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addTextValue, setAddTextValue] = useState("");

  const openAddText = useCallback(() => {
    setAddTextValue("");
    setAddTextOpen(true);
  }, []);

  const cancelAddText = useCallback(() => {
    setAddTextOpen(false);
  }, []);

  const confirmAddText = useCallback(() => {
    const txt = (addTextValue ?? "").trim();
    if (!txt) {
      setAddTextOpen(false);
      return;
    }

    setEditState((prev) => {
      const safeItems = Array.isArray(prev.textItems) ? prev.textItems : [];
      const index = safeItems.length;
      const id = `txt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const nextItem = {
        id,
        text: txt,
        pos: { x: 24, y: 120 + (index % 8) * 64 },
        font: 30,
      };

      return {
        ...prev,
        textItems: [...safeItems, nextItem],
        activeTextId: id,
      };
    });

    setAddTextOpen(false);
  }, [addTextValue, setEditState]);

  return {
    addTextOpen,
    addTextValue,
    setAddTextValue,
    openAddText,
    cancelAddText,
    confirmAddText,
  };
}
