import { useCallback, useState } from "react";

type Args = {
  nextTextTarget: "name1" | "name2" | null;
  setName1: (v: string) => void;
  setName1Pos: (p: { x: number; y: number }) => void;
  setName1Font: (n: number) => void;
  setName2: (v: string) => void;
  setName2Pos: (p: { x: number; y: number }) => void;
  setName2Font: (n: number) => void;
};

export function usePdfPageAddText({
  nextTextTarget,
  setName1,
  setName1Pos,
  setName1Font,
  setName2,
  setName2Pos,
  setName2Font,
}: Args) {
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
      setName1(txt);
      setName1Pos({ x: 24, y: 160 });
      setName1Font(30);
    } else {
      setName2(txt);
      setName2Pos({ x: 24, y: 240 });
      setName2Font(30);
    }

    setAddTextOpen(false);
  }, [
    addTextValue,
    nextTextTarget,
    setName1,
    setName1Font,
    setName1Pos,
    setName2,
    setName2Font,
    setName2Pos,
  ]);

  return {
    addTextOpen,
    addTextValue,
    setAddTextValue,
    openAddText,
    cancelAddText,
    confirmAddText,
  };
}
