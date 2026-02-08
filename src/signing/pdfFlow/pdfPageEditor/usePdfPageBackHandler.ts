import { useCallback, useEffect } from "react";
import { Alert, BackHandler } from "react-native";
import type { TFunction } from "i18next";
import type { PageEditState } from "../../../screens/signPdf/signPdfTypes";

type Size = { w: number; h: number } | null;

type Args = {
  pageNumber: number;
  normSize: Size;
  buildEditState: (pageNumber: number, size: { w: number; h: number }) => PageEditState;
  onBackToGrid: (editState: PageEditState) => void;
  t: TFunction;
};

export function usePdfPageBackHandler({
  pageNumber,
  normSize,
  buildEditState,
  onBackToGrid,
  t,
}: Args) {
  const handleBackToGrid = useCallback(() => {
    if (!normSize?.w || !normSize?.h) {
      Alert.alert(
        t("common.alerts.errorTitle"),
        t("signPdf.pageEditor.pageNotReady"),
      );
      return;
    }

    const editState = buildEditState(pageNumber, normSize);
    onBackToGrid(editState);
  }, [buildEditState, normSize, onBackToGrid, pageNumber, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBackToGrid();
      return true;
    });

    return () => sub.remove();
  }, [handleBackToGrid]);

  return { handleBackToGrid };
}
