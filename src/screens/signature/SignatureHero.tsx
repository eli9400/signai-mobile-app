import React from "react";
import { Text, View } from "react-native";
import { styles } from "./SignatureScreen.styles";

type Props = {
  title: string;
  status: string;
};

export default function SignatureHero({ title, status }: Props) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSub}>{status}</Text>
    </View>
  );
}
