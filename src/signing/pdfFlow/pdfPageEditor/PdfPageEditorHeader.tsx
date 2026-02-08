import { View, Text } from "react-native";
import { BackIconButton } from "../../../ui/icons";
import { styles } from "./PdfPageEditor.styles";

type Props = {
  title: string;
  onBack: () => void;
};

export default function PdfPageEditorHeader({ title, onBack }: Props) {
  return (
    <View style={styles.top}>
      <BackIconButton onPress={onBack} />
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}
