// src/signing/pdfFlow/PdfPagesGrid.tsx
import React, { useMemo, useCallback } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import PdfPagesGridHeader from "./pdfPagesGrid/PdfPagesGridHeader";
import PdfPagesGridList from "./pdfPagesGrid/PdfPagesGridList";
import PdfPagesGridSelectedRow from "./pdfPagesGrid/PdfPagesGridSelectedRow";
import PdfPagesGridThumbRenderer from "./pdfPagesGrid/PdfPagesGridThumbRenderer";
import { styles } from "./pdfPagesGrid/PdfPagesGrid.styles";
import { usePdfPagesThumbQueue } from "./pdfPagesGrid/usePdfPagesThumbQueue";

type Props = {
  subtitle?: string | null;
  pdfReady: boolean;
  isLoading: boolean;
  onClose: () => void;
  onPickPdf: () => void;
  totalPages: number;
  selectedPages: Set<number>;
  setSelectedPages: (s: Set<number>) => void;
  onOpenPage: (pageNumber: number) => void;
  pdfBase64?: string;
  thumbnails: Record<number, string>;
  setThumbnails: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onExportPdf?: () => void;
  exportDisabled?: boolean;
  exportLabel?: string;
};

export default function PdfPagesGrid({
  subtitle,
  pdfReady,
  isLoading,
  onClose,
  onPickPdf: _onPickPdf,
  totalPages,
  selectedPages,
  setSelectedPages,
  onOpenPage,
  pdfBase64,
  thumbnails,
  setThumbnails,
  onExportPdf,
  exportDisabled,
  exportLabel,
}: Props) {
  const { t } = useTranslation();

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  const allSelected = totalPages > 0 && selectedPages.size === totalPages;
  const someSelected =
    selectedPages.size > 0 && selectedPages.size < totalPages;

  const toggleSelectAll = useCallback(() => {
    if (!totalPages) return;
    if (allSelected) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(
        new Set(Array.from({ length: totalPages }, (_, i) => i + 1)),
      );
    }
  }, [allSelected, setSelectedPages, totalPages]);

  const togglePage = useCallback(
    (p: number) => {
      const next = new Set(selectedPages);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      setSelectedPages(next);
    },
    [selectedPages, setSelectedPages],
  );

  const selectLabel = allSelected
    ? t("signPdf.pagesGrid.deselectAll")
    : t("signPdf.pagesGrid.selectAll");

  const selectIcon: keyof typeof Ionicons.glyphMap = allSelected
    ? "checkbox"
    : someSelected
      ? "remove-circle-outline"
      : "square-outline";

  const {
    renderPage,
    onViewableItemsChanged,
    onEndReached,
    viewabilityConfig,
    onThumbRendered,
    onThumbError,
  } = usePdfPagesThumbQueue({
    pdfReady,
    pdfBase64,
    totalPages,
    pages,
    thumbnails,
    setThumbnails,
  });

  return (
    <View style={styles.root}>
      <PdfPagesGridHeader
        onClose={onClose}
        onExportPdf={onExportPdf}
        exportDisabled={exportDisabled}
        exportLabel={exportLabel || t("signPdf.actions.exportPdf")}
        selectLabel={selectLabel}
        selectIcon={selectIcon}
        selectDisabled={isLoading || !pdfReady || totalPages <= 0}
        onToggleSelectAll={toggleSelectAll}
        isSelectedState={allSelected || someSelected}
      />

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <PdfPagesGridSelectedRow
        label={t("signPdf.pagesGrid.selectedCount", {
          selected: selectedPages.size,
          total: totalPages || 0,
        })}
      />

      <PdfPagesGridList
        pages={pages}
        selectedPages={selectedPages}
        thumbnails={thumbnails}
        onOpenPage={onOpenPage}
        onTogglePage={togglePage}
        onEndReached={onEndReached}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        thumbLabelFor={(page) =>
          t("signPdf.pagesGrid.thumbLabel", { page })
        }
        cardLabelFor={(page) =>
          t("signPdf.pagesGrid.cardLabel", { page })
        }
        emptyLabel={t("signPdf.pagesGrid.emptyHint")}
      />

      <PdfPagesGridThumbRenderer
        pdfBase64={pdfBase64}
        renderPage={renderPage}
        onRendered={onThumbRendered}
        onError={onThumbError}
      />
    </View>
  );
}
