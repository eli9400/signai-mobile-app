import { FlatList, Text, View } from "react-native";
import PdfPageCard from "./PdfPageCard";

type Props = {
  pages: number[];
  selectedPages: Set<number>;
  thumbnails: Record<number, string>;
  onOpenPage: (pageNumber: number) => void;
  onTogglePage: (pageNumber: number) => void;
  onEndReached: () => void;
  onViewableItemsChanged: (info: any) => void;
  viewabilityConfig: any;
  thumbLabelFor: (page: number) => string;
  cardLabelFor: (page: number) => string;
  emptyLabel: string;
};

export default function PdfPagesGridList({
  pages,
  selectedPages,
  thumbnails,
  onOpenPage,
  onTogglePage,
  onEndReached,
  onViewableItemsChanged,
  viewabilityConfig,
  thumbLabelFor,
  cardLabelFor,
  emptyLabel,
}: Props) {
  return (
    <FlatList
      data={pages}
      keyExtractor={(p) => String(p)}
      numColumns={2}
      columnWrapperStyle={{ gap: 14 }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      renderItem={({ item: page }) => (
        <PdfPageCard
          pageNumber={page}
          thumbnail={thumbnails[page]}
          isSelected={selectedPages.has(page)}
          onOpen={onOpenPage}
          onToggle={onTogglePage}
          thumbLabel={thumbLabelFor(page)}
          cardLabel={cardLabelFor(page)}
        />
      )}
      initialNumToRender={6}
      windowSize={7}
      removeClippedSubviews
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      ListEmptyComponent={
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={{ opacity: 0.6 }}>{emptyLabel}</Text>
        </View>
      }
    />
  );
}
