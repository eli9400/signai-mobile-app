import { View } from "react-native";
import PdfPageToPngWebView from "../../pdf/PdfPageToPngWebView";
import { styles } from "./PdfPageEditor.styles";

type Props = {
  pdfBase64: string;
  pageNumber: number;
  onRendered: (dataUrl: string, meta: { width: number; height: number }) => void;
  onError: () => void;
};

export default function PdfPageEditorRenderer({
  pdfBase64,
  pageNumber,
  onRendered,
  onError,
}: Props) {
  return (
    <View style={styles.hidden}>
      <PdfPageToPngWebView
        pdfBase64={pdfBase64}
        pageNumber={pageNumber}
        onRendered={(dataUrl, meta) => {
          onRendered(String(dataUrl), { width: meta.width, height: meta.height });
        }}
        onError={onError}
      />
    </View>
  );
}
