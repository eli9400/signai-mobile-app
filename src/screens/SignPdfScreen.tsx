// src/screens/SignPdfScreen.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { View, Platform, BackHandler, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePdfDocument } from "../signing/hooks/usePdfDocument";
import PdfPageToPngWebView from "../signing/pdf/PdfPageToPngWebView";

import PdfPagesGrid from "../signing/pdfFlow/PdfPagesGrid";
import PdfPageEditor from "../signing/pdfFlow/PdfPageEditor";

type Props = {
  signatureUri: string | null;
  onBack: () => void;

  // מגיע מה-Home אחרי בחירת קובץ
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
};

export default function SignPdfScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const doc = usePdfDocument();

  const autoPickedRef = useRef(false);

  // אם נכנסנו מהבית בלי initialFileUri -> פותחים picker אוטומטית פעם אחת
  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;

    // יש קובץ שמגיע מבחוץ (open-with/share) -> לא פותחים picker
    if (initialFileUri) return;

    // כבר יש PDF טעון -> לא פותחים
    if (doc.pdf?.uri) return;

    // כבר פתחנו פעם אחת במסך הזה -> לא פותחים שוב
    if (autoPickedRef.current) return;

    // אם hook עסוק כרגע -> נחכה ל-render הבא
    if (doc.isBusy) return;

    autoPickedRef.current = true;

    // תן למסך להתייצב רגע לפני פתיחת native picker
    setTimeout(() => {
      doc.pickPdf();
    }, 50);
  }, [initialFileUri, doc.pdf?.uri, doc.isBusy, doc.pickPdf]);

  // flow state
  const [view, setView] = useState<"grid" | "editor">("grid");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [activePage, setActivePage] = useState<number>(1);

  // total pages discovered from Pdf renderer meta
  const [totalPages, setTotalPages] = useState<number>(0);

  const pdfBase64 = doc.pdf?.base64 ?? null;
  const pdfName = doc.pdf?.name ?? null;
  const hasPdf = Boolean(doc.pdf?.uri);

  useEffect(() => {
    if (!totalPages) return;
    // ברירת מחדל: לבחור את כל הדפים
    setSelectedPages(
      new Set(Array.from({ length: totalPages }, (_, i) => i + 1)),
    );
  }, [totalPages]);

  // Load incoming PDF from "Open with"
  useEffect(() => {
    if (!initialFileUri) return;
    doc.openPdfFromUri(initialFileUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFileUri]);

  // When PDF loaded: reset flow & notify home
  useEffect(() => {
    if (!doc.pdf?.uri) return;

    onFileLoaded?.();

    setView("grid");
    setActivePage(1);
    setSelectedPages(new Set());
    setTotalPages(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.pdf?.uri]);

  const subtitle = useMemo(() => {
    if (!pdfName) return null;
    return totalPages ? `${pdfName} • ${totalPages} דפים` : pdfName;
  }, [pdfName, totalPages]);

  const isLoading = doc.isBusy;

  // We render page 1 invisibly ONLY to discover totalPages
  const shouldDiscoverTotal = Boolean(pdfBase64) && totalPages === 0;

  // ✅ יציאה מהמסמך דרך הכפתור שלנו (ב-Grid)
  // זה מחקה את AppInner: אם יש קובץ נטען => דיאלוג, אחרת יציאה שקטה.
  const confirmExitToHome = useCallback(() => {
    if (!hasPdf) {
      onBack();
      return;
    }

    Alert.alert("יציאה מהמסמך", "האם לחזור למסך הראשי?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "חזרה למסך הראשי",
        style: "destructive",
        onPress: onBack,
      },
    ]);
  }, [hasPdf, onBack]);

  // ✅ Android hardware back:
  // - Editor: חוזר ל-Grid (אנחנו מטפלים)
  // - Grid: לא מטפלים כדי ש-AppInner יפתח את הדיאלוג כמו שכבר יש לך
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBack = () => {
      if (view === "editor") {
        setView("grid");
        return true;
      }
      return false; // let AppInner handle it (dialog + home)
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );
    return () => sub.remove();
  }, [view]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {view === "grid" ? (
        <PdfPagesGrid
          title="דפי PDF"
          subtitle={subtitle}
          pdfReady={Boolean(pdfBase64)}
          isLoading={isLoading || shouldDiscoverTotal}
          onClose={confirmExitToHome} // ✅ החץ שלנו פותח דיאלוג (אם יש קובץ)
          onPickPdf={doc.pickPdf}
          totalPages={totalPages}
          selectedPages={selectedPages}
          setSelectedPages={setSelectedPages}
          onOpenPage={(pageNumber) => {
            setActivePage(pageNumber);
            setView("editor");
          }}
          pdfBase64={pdfBase64 ?? undefined}
        />
      ) : (
        <PdfPageEditor
          title={`עמוד ${activePage}${totalPages ? ` מתוך ${totalPages}` : ""}`}
          onBackToGrid={() => setView("grid")} // ✅ חץ בתוך עורך יחזיר לגריד
          pdfBase64={pdfBase64}
          pageNumber={activePage}
          // signatureUri={signatureUri}
        />
      )}

      {/* Hidden: discover totalPages once (from the renderer meta) */}
      {shouldDiscoverTotal && pdfBase64 && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <PdfPageToPngWebView
            pdfBase64={pdfBase64}
            pageNumber={1}
            onRendered={(_, meta) => {
              const t = Number((meta as any).totalPages ?? 0);
              if (t > 0) setTotalPages(t);
            }}
            onError={() => {
              // leave totalPages=0; grid can still show file + let user retry/choose another
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
