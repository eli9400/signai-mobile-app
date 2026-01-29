// src/signing/pdfFlow/PdfPagesGrid.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import PdfPageToPngWebView from "../pdf/PdfPageToPngWebView";
import { BackIconButton } from "../../ui/icons";

type Props = {
  title: string;
  subtitle?: string | null;

  pdfReady: boolean;
  isLoading: boolean;

  onClose: () => void;
  onPickPdf: () => void; // נשאר בחתימה (לא חייבים להשתמש בו כאן)

  totalPages: number;

  selectedPages: Set<number>;
  setSelectedPages: (s: Set<number>) => void;

  onOpenPage: (pageNumber: number) => void;

  pdfBase64?: string;
};

export default function PdfPagesGrid({
  title,
  subtitle,
  pdfReady,
  isLoading,
  onClose,
  onPickPdf: _onPickPdf, // לא משתמשים בו כרגע (מכוון)
  totalPages,
  selectedPages,
  setSelectedPages,
  onOpenPage,
  pdfBase64,
}: Props) {
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  const allSelected = totalPages > 0 && selectedPages.size === totalPages;

  const toggleSelectAll = useCallback(() => {
    if (!totalPages) return;

    if (allSelected) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(
        new Set(Array.from({ length: totalPages }, (_, i) => i + 1)),
      );
    }
  }, [allSelected, setSelectedPages, totalPages]);

  // ---- thumbnails state ----
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const queueRef = useRef<number[]>([]);
  const renderingRef = useRef(false);
  const [renderPage, setRenderPage] = useState<number | null>(null);

  // reset thumbs when pdf changes
  useEffect(() => {
    setThumbs({});
    queueRef.current = [];
    renderingRef.current = false;
    setRenderPage(null);
  }, [pdfBase64]);

  const enqueuePages = useCallback(
    (pageNums: number[]) => {
      if (!pdfBase64) return;

      const next = [...queueRef.current];
      for (const p of pageNums) {
        if (p < 1 || p > totalPages) continue;
        if (thumbs[p]) continue; // already have thumb
        if (next.includes(p)) continue; // already queued
        next.push(p);
      }
      queueRef.current = next;

      if (!renderingRef.current) {
        const first = queueRef.current.shift();
        if (first) {
          renderingRef.current = true;
          setRenderPage(first);
        }
      }
    },
    [pdfBase64, totalPages, thumbs],
  );

  // load first 6 immediately
  useEffect(() => {
    if (!pdfBase64 || totalPages <= 0) return;
    enqueuePages(pages.slice(0, 6));
  }, [pdfBase64, totalPages, enqueuePages, pages]);

  // FlatList viewability (lazy-load on scroll)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const visible: number[] = [];
    for (const vi of viewableItems) {
      const p = vi?.item;
      if (typeof p === "number") visible.push(p);
    }

    // prefetch: visible + next 4 pages
    const extra: number[] = [];
    for (const p of visible) {
      for (let k = 0; k < 4; k++) extra.push(p + k);
    }
    enqueuePages([...visible, ...extra]);
  }).current;

  const onEndReached = useCallback(() => {
    if (!totalPages) return;

    const loadedNums = Object.keys(thumbs)
      .map((x) => Number(x))
      .filter(Boolean);
    const maxLoaded = loadedNums.length ? Math.max(...loadedNums) : 0;

    const start = Math.max(1, maxLoaded + 1);
    const nextBatch: number[] = [];
    for (let p = start; p <= Math.min(totalPages, start + 12); p++) {
      nextBatch.push(p);
    }

    enqueuePages(nextBatch);
  }, [enqueuePages, thumbs, totalPages]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 80,
  }).current;

  const toggle = (p: number) => {
    const next = new Set(selectedPages);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setSelectedPages(next);
  };

  // בתוך PdfPagesGrid.tsx

  const renderItem = ({ item: p }: { item: number }) => {
    const isSel = selectedPages.has(p);
    const thumb = thumbs[p];

    return (
      <Pressable style={styles.card} onPress={() => onOpenPage(p)}>
        <View style={styles.thumbBox}>
          {thumb ? (
            <Image
              source={{ uri: thumb }}
              style={styles.thumbImg}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbPlaceholderText}>עמוד {p}</Text>
            </View>
          )}

          {/* ✅ checkbox - גדול יותר, בפינה, ועוצר bubbling */}
          <Pressable
            onPress={(e) => {
              // לעצור את לחיצת ה-Card מאחורי זה
              // @ts-ignore - RN event has stopPropagation at runtime
              e?.stopPropagation?.();
              toggle(p);
            }}
            hitSlop={12}
            style={[styles.check, isSel && styles.checkOn]}
          >
            {isSel ? <Text style={styles.checkTextOn}>✓</Text> : null}
          </Pressable>
        </View>

        <Text style={styles.cardLabel}>דף {p}</Text>
      </Pressable>
    );
  };

  const someSelected =
    selectedPages.size > 0 && selectedPages.size < totalPages;

  const selectLabel = allSelected ? "בטל הכל" : "סמן הכל";

  const selectIcon: keyof typeof Ionicons.glyphMap = allSelected
    ? "checkbox"
    : someSelected
      ? "remove-circle-outline"
      : "square-outline";

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <BackIconButton onPress={onClose} />

        <View style={styles.centerTitle}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Toggle select all */}
        <Pressable
          style={[
            styles.selectAllChip,
            (isLoading || !pdfReady || totalPages <= 0) &&
              styles.selectAllChipDis,
          ]}
          onPress={toggleSelectAll}
          disabled={isLoading || !pdfReady || totalPages <= 0}
          hitSlop={10}
        >
          <Ionicons
            name={selectIcon}
            size={18}
            color={
              allSelected ? "#6d28d9" : someSelected ? "#6d28d9" : "#6b7280"
            }
          />
          <Text
            style={[
              styles.selectAllText,
              (allSelected || someSelected) && styles.selectAllTextOn,
            ]}
          >
            {selectLabel}
          </Text>
        </Pressable>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.actionsRow}>
        <View style={styles.selectedPill}>
          <Text style={styles.selectedPillText}>
            נבחרו {selectedPages.size} / {totalPages || 0}
          </Text>
        </View>
      </View>

      <FlatList
        data={pages}
        keyExtractor={(p) => String(p)}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={renderItem}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ opacity: 0.6 }}>בחר PDF כדי לראות דפים</Text>
          </View>
        }
      />

      {/* Hidden renderer: renders ONE page at a time for thumbnails */}
      {pdfBase64 && renderPage && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <PdfPageToPngWebView
            pdfBase64={pdfBase64}
            pageNumber={renderPage}
            onRendered={(dataUrl) => {
              setThumbs((prev) => ({ ...prev, [renderPage]: String(dataUrl) }));

              const next = queueRef.current.shift() ?? null;
              if (next) setRenderPage(next);
              else {
                renderingRef.current = false;
                setRenderPage(null);
              }
            }}
            onError={() => {
              const next = queueRef.current.shift() ?? null;
              if (next) setRenderPage(next);
              else {
                renderingRef.current = false;
                setRenderPage(null);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#eef2ff" },

  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  centerTitle: { flex: 1, alignItems: "center" },

  title: { fontSize: 20, fontWeight: "900" },
  subtitle: { textAlign: "center", opacity: 0.7, marginBottom: 8 },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  iconBtnDis: { opacity: 0.4 },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  selectedPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  selectedPillText: { fontWeight: "800" },

  hint: { opacity: 0.65, fontWeight: "800" },

  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    elevation: 4,
  },
  thumbBox: {
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  thumbPlaceholderText: { opacity: 0.35, fontWeight: "800" },

  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#6d28d9",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: "#6d28d9" },
  checkTextOn: { color: "white", fontWeight: "900" },

  checkText: { color: "#6d28d9", fontWeight: "900" },

  cardLabel: {
    marginTop: 10,
    fontWeight: "900",
    textAlign: "center",
    opacity: 0.85,
  },
  selectAllChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    elevation: 3,
  },
  selectAllChipDis: { opacity: 0.45 },
  selectAllText: {
    fontWeight: "900",
    color: "#6b7280",
  },
  selectAllTextOn: {
    color: "#6d28d9",
  },
});
