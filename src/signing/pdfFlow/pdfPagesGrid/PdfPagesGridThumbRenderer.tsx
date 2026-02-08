import { View } from "react-native";
import PdfPageToPngWebView from "../../pdf/PdfPageToPngWebView";

type Props = {
  pdfBase64?: string;
  renderPage: number | null;
  onRendered: (dataUrl: string) => void;
  onError: () => void;
};

export default function PdfPagesGridThumbRenderer({
  pdfBase64,
  renderPage,
  onRendered,
  onError,
}: Props) {
  if (!pdfBase64 || !renderPage) return null;

  return (
    <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
      <PdfPageToPngWebView
        pdfBase64={pdfBase64}
        pageNumber={renderPage}
        onRendered={(dataUrl) => onRendered(String(dataUrl))}
        onError={onError}
      />
    </View>
  );
}
