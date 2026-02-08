import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../ui/theme";

type Props = {
  greeting: string;
  avatarFallback: string;
  avatarUrl?: string | null;
  onOpenProfile: () => void;
};

export default function HomeHeader({
  greeting,
  avatarFallback,
  avatarUrl,
  onOpenProfile,
}: Props) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topLeft}>
        <Pressable onPress={onOpenProfile} style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{avatarFallback}</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.appTitle}>{greeting}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  avatarText: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 17 },
  appTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 18,
    marginStart: 50,
  },
});
