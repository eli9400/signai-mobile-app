import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import PdfPageToPngWebView from "../pdf/PdfPageToPngWebView";

type Props = {
  pdfBase64: string;
  totalPages: number;
  // איזה דפים אתה רוצה להכין thumbnails עבורם (למשל כל הדפים או רק הראשונים)
  targetPages: number[];
  // יחזיר dataUrl (png) של thumbnail
  onThumb: (pageNumber: number, dataUrl: string) => void;
};

export default function PdfThumbQueue({
  pdfBase64,
  totalPages,
  targetPages,
  onThumb,
}: Props) {
  const pages = useMemo(() => {
    // ניקוי + סינון לטווח חוקי + מניעת כפילויות
    const uniq = Array.from(new Set(targetPages))
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);
    return uniq;
  }, [targetPages, totalPages]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    // אם ה-PDF משתנה או הרשימה משתנה – מתחילים מהתחלה
    setIndex(0);
  }, [pdfBase64, pages.join(",")]);

  const pageNumber = pages[index];

  if (!pageNumber) return null;

  return (
    <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
      <PdfPageToPngWebView
        pdfBase64={pdfBase64}
        pageNumber={pageNumber}
        quality="thumb"
        onRendered={(dataUrl, meta) => {
          // meta.pageNumber אמור להתאים לעמוד שנרנדר
          onThumb(meta.pageNumber, dataUrl);
          setIndex((i) => i + 1);
        }}
        onError={() => {
          // אם עמוד אחד נכשל – מדלגים עליו כדי לא להיתקע
          setIndex((i) => i + 1);
        }}
      />
    </View>
  );
}
