import { Image, Pressable, Text, View } from "react-native";
import { styles } from "./PdfPagesGrid.styles";

type Props = {
  pageNumber: number;
  isSelected: boolean;
  thumbnail?: string;
  thumbLabel: string;
  cardLabel: string;
  onOpen: (page: number) => void;
  onToggle: (page: number) => void;
};

export default function PdfPageCard({
  pageNumber,
  isSelected,
  thumbnail,
  thumbLabel,
  cardLabel,
  onOpen,
  onToggle,
}: Props) {
  return (
    <Pressable style={styles.card} onPress={() => onOpen(pageNumber)}>
      <View style={styles.thumbBox}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbImg} resizeMode="contain" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderText}>{thumbLabel}</Text>
          </View>
        )}

        <Pressable
          onPress={(e) => {
            // @ts-ignore
            e?.stopPropagation?.();
            onToggle(pageNumber);
          }}
          hitSlop={12}
          style={[styles.check, isSelected && styles.checkOn]}
        >
          {isSelected ? <Text style={styles.checkTextOn}>{"\u2713"}</Text> : null}
        </Pressable>
      </View>

      <Text style={styles.cardLabel}>{cardLabel}</Text>
    </Pressable>
  );
}
