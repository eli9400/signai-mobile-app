import React, { useMemo, useState, useCallback } from "react";
import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { usePdfDocument } from "../signing/hooks/usePdfDocument";
import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";
import PdfPagesGrid from "../signing/pdfFlow/PdfPagesGrid";
import PdfPageEditor from "../signing/pdfFlow/PdfPageEditor";
import { savePdfAndShare } from "../signing/export/exportAndSharePdf";
import { exportStampedPdf } from "./signPdf/pdfExport";
import { createDefaultPageEdit } from "./signPdf/signPdfState";
import { type PageEditState } from "./signPdf/signPdfTypes";
import PdfExportOverlay from "./signPdf/PdfExportOverlay";
import { useSignPdfEffects } from "./signPdf/useSignPdfEffects";
import { useInterstitialAd } from "../hooks/useInterstitialAd";
import { useUserContext } from "../contexts/UserContext";
type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
};
export default function SignPdfScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const { t } = useTranslation();
  const { showAd } = useInterstitialAd();
  const { consumeAction, canUse, loading: userLoading } = useUserContext();
  const doc = usePdfDocument();
  const [view, setView] = useState<"grid" | "editor">("grid");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [activePage, setActivePage] = useState<number>(1);
  const [pageEdits, setPageEdits] = useState<Record<number, PageEditState>>({});
  const [totalPages, setTotalPages] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportTotal, setExportTotal] = useState(0);
  const [exportDone, setExportDone] = useState(0);
  const pdfBase64 = doc.pdf?.base64 ?? null;
  const pdfName = doc.pdf?.name ?? null;
  const hasPdf = Boolean(doc.pdf?.uri);
  const canUseAction = userLoading ? true : canUse;
  const exportPct = exportTotal
    ? Math.round((exportDone / exportTotal) * 100)
    : 0;
  useSignPdfEffects({
    doc,
    initialFileUri,
    onFileLoaded,
    totalPages,
    setSelectedPages,
    setView,
    setActivePage,
    setTotalPages,
    setPageEdits,
    setThumbnails,
    view,
    isExportingPdf,
  });
  const subtitle = useMemo(
    () =>
      !pdfName
        ? null
        : totalPages
          ? `${pdfName} • ${t("signPdf.subtitlePages", { count: totalPages })}`
          : pdfName,
    [pdfName, totalPages, t],
  );
  const isLoading = doc.isBusy;
  const shouldDiscoverTotal = Boolean(pdfBase64) && totalPages === 0;
  const getPageEdit = useCallback(
    (pageNumber: number): PageEditState =>
      pageEdits[pageNumber] ?? createDefaultPageEdit(pageNumber),
    [pageEdits],
  );
  const handleBackToGrid = useCallback((editState: PageEditState) => {
    setPageEdits((prev) => ({
      ...prev,
      [editState.pageNumber]: editState,
    }));
    setView("grid");
  }, []);
  const confirmExitToHome = useCallback(() => {
    if (isExportingPdf) {
      Alert.alert(
        t("signPdf.alerts.exportActiveTitle"),
        t("signPdf.alerts.exportActiveBody"),
        [{ text: t("signPdf.actions.ok") }],
      );
      return;
    }

    if (!hasPdf) {
      onBack();
      return;
    }
    Alert.alert(t("common.alerts.exitTitle"), t("common.alerts.exitBody"), [
      { text: t("common.actions.cancel"), style: "cancel" },
      {
        text: t("common.actions.backToHome"),
        style: "destructive",
        onPress: onBack,
      },
    ]);
  }, [hasPdf, onBack, isExportingPdf, t]);
  const startExportPdf = useCallback(async () => {
    if (isExportingPdf) return;
    if (!pdfBase64) return;
    if (!canUseAction) return;
    let shouldExit = false;
    const pages = Array.from(selectedPages)
      .slice()
      .sort((a, b) => a - b);
    if (pages.length === 0) {
      Alert.alert(
        t("signPdf.alerts.exportTitle"),
        t("signPdf.alerts.noPagesSelected"),
      );
      return;
    }
    try {
      setIsExportingPdf(true);
      setExportTotal(pages.length);
      setExportDone(0);
      const outB64 = await exportStampedPdf({
        pdfBase64,
        pagesToExport: pages,
        pageEdits,
        signatureUri,
        onProgress: (done, total) => {
          setExportDone(done);
          setExportTotal(total);
        },
        t,
      });
      const base = (pdfName || "signed-document").replace(/\.(pdf)$/i, "");
      const outName = `${base}-signed.pdf`;
      await savePdfAndShare(outB64, outName, t("signPdf.actions.sharePdf"));
      await consumeAction();
      showAd();
      shouldExit = true;
    } catch (e: any) {
      Alert.alert(
        t("signPdf.alerts.exportTitle"),
        e?.message ?? t("signPdf.alerts.exportFailed"),
      );
    } finally {
      setIsExportingPdf(false);
      if (shouldExit) onBack();
    }
  }, [
    isExportingPdf,
    pdfBase64,
    selectedPages,
    pageEdits,
    signatureUri,
    pdfName,
    t,
    canUseAction,
    consumeAction,
    showAd,
    onBack,
  ]);
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {view === "grid" ? (
        <PdfPagesGrid
          subtitle={subtitle}
          pdfReady={Boolean(pdfBase64)}
          isLoading={isLoading || shouldDiscoverTotal}
          onClose={confirmExitToHome}
          onPickPdf={doc.pickPdf}
          totalPages={totalPages}
          onExportPdf={startExportPdf}
          exportDisabled={!canUseAction || isExportingPdf}
          selectedPages={selectedPages}
          setSelectedPages={setSelectedPages}
          onOpenPage={(pageNumber) => {
            setActivePage(pageNumber);
            setView("editor");
          }}
          pdfBase64={pdfBase64 ?? undefined}
          thumbnails={thumbnails}
          setThumbnails={setThumbnails}
        />
      ) : (
        <PdfPageEditor
          title={t("signPdf.editor.title", {
            page: activePage,
            total: totalPages || undefined,
          })}
          onBackToGrid={handleBackToGrid}
          pdfBase64={pdfBase64}
          pageNumber={activePage}
          signatureUri={signatureUri}
          initialEdit={getPageEdit(activePage)}
        />
      )}
      {shouldDiscoverTotal && pdfBase64 && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <PdfPageToPngWebView
            pdfBase64={pdfBase64}
            pageNumber={1}
            onRendered={(_, meta) => {
              const tt = Number((meta as any).totalPages ?? 0);
              if (tt > 0) setTotalPages(tt);
            }}
            onError={() => {}}
          />
        </View>
      )}
      <PdfExportOverlay
        open={isExportingPdf}
        title={t("signPdf.export.overlayTitle")}
        progressLabel={t("signPdf.export.progress", {
          done: exportDone,
          total: exportTotal,
          pct: exportPct,
        })}
        workingLabel={t("signPdf.export.working")}
      />
    </SafeAreaView>
  );
}
