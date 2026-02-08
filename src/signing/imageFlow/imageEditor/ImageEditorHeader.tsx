import React from "react";
import { Text, View } from "react-native";
import { BackIconButton, ExportPngPillButton } from "../../../ui/icons";
import { styles } from "./ImageEditor.styles";

type Props = {
  title: string;
  onClose: () => void;
  showExport: boolean;
  onExport: () => void;
  exportDisabled: boolean;
  exportLabel: string;
};

export default function ImageEditorHeader({
  title,
  onClose,
  showExport,
  onExport,
  exportDisabled,
  exportLabel,
}: Props) {
  return (
    <View style={styles.top}>
      <BackIconButton onPress={onClose} />
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {showExport ? (
        <ExportPngPillButton
          onPress={onExport}
          disabled={exportDisabled}
          label={exportLabel}
        />
      ) : null}
    </View>
  );
}
