import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BackIconButton, ExportPdfPillButton } from "../../../ui/icons";
import { styles } from "./PdfPagesGrid.styles";

type Props = {
  onClose: () => void;
  onExportPdf?: () => void;
  exportDisabled?: boolean;
  exportLabel: string;
  selectLabel: string;
  selectIcon: keyof typeof Ionicons.glyphMap;
  selectDisabled: boolean;
  onToggleSelectAll: () => void;
  isSelectedState: boolean;
};

export default function PdfPagesGridHeader({
  onClose,
  onExportPdf,
  exportDisabled,
  exportLabel,
  selectLabel,
  selectIcon,
  selectDisabled,
  onToggleSelectAll,
  isSelectedState,
}: Props) {
  return (
    <View style={styles.top}>
      <BackIconButton onPress={onClose} />

      <View style={styles.centerTitle} />

      <ExportPdfPillButton
        onPress={() => onExportPdf?.()}
        disabled={Boolean(exportDisabled)}
        size={26}
        color="#7c3aed"
        style={{
          backgroundColor: "#fff",
          borderColor: "#7c3aed",
          borderWidth: 2,
        }}
        label={exportLabel}
      />

      <Pressable
        style={[styles.selectAllChip, selectDisabled && styles.selectAllChipDis]}
        onPress={onToggleSelectAll}
        disabled={selectDisabled}
        hitSlop={10}
      >
        <Ionicons
          name={selectIcon}
          size={18}
          color={isSelectedState ? "#6d28d9" : "#6b7280"}
        />
        <Text
          style={[styles.selectAllText, isSelectedState && styles.selectAllTextOn]}
        >
          {selectLabel}
        </Text>
      </Pressable>
    </View>
  );
}
