import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TextItem } from "../../hooks/useOverlayGestures";

type Args = {
  textItems: TextItem[];
  setTextItems: Dispatch<SetStateAction<TextItem[]>>;
  setActiveTextId: (id: string | null) => void;
};

export function usePdfPageAddText({
  textItems,
  setTextItems,
  setActiveTextId,
}: Args) {
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

    const safeItems = Array.isArray(textItems) ? textItems : [];
    const id = `txt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const nextItem: TextItem = {
      id,
      text: txt,
      pos: { x: 24, y: 120 + (safeItems.length % 8) * 64 },
      font: 30,
    };

    setTextItems((prev) => {
      const prevSafe = Array.isArray(prev) ? prev : [];
      return [...prevSafe, nextItem];
    });
    setActiveTextId(id);
    setAddTextOpen(false);
  }, [addTextValue, setActiveTextId, setTextItems, textItems]);

  return {
    addTextOpen,
    addTextValue,
    setAddTextValue,
    openAddText,
    cancelAddText,
    confirmAddText,
  };
}
