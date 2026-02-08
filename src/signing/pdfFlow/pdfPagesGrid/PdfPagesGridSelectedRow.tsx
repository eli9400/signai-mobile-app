import { Text, View } from "react-native";
import { styles } from "./PdfPagesGrid.styles";

type Props = {
  label: string;
};

export default function PdfPagesGridSelectedRow({ label }: Props) {
  return (
    <View style={styles.actionsRow}>
      <View style={styles.selectedPill}>
        <Text style={styles.selectedPillText}>{label}</Text>
      </View>
    </View>
  );
}
