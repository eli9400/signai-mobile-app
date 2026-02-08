import React from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "./SignatureScreen.styles";
import { ICON_CLOSE } from "./signatureIcons";

type Props = {
  title: string;
  onClose: () => void;
};

export default function SignatureHeader({ title, onClose }: Props) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.appTitle}>{title}</Text>

      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>{ICON_CLOSE}</Text>
      </Pressable>
    </View>
  );
}
