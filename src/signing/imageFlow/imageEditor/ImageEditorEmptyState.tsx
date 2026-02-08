import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { styles } from "./ImageEditor.styles";

const EMPTY_ICON = "\u{1F5BC}\uFE0F";

type Props = {
  text: string;
  loading: boolean;
};

export default function ImageEditorEmptyState({ text, loading }: Props) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{EMPTY_ICON}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {loading ? <ActivityIndicator color="#6d28d9" /> : null}
    </View>
  );
}
