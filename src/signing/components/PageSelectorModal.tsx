// src/signing/components/PageSelectorModal.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import type { EditedPage } from "../hooks/usePdfEditor";

type Props = {
  visible: boolean;
  pages: EditedPage[];
  onTogglePage: (pageNumber: number) => void;
  onCancel: () => void;
  onExport: () => void;
};

export default function PageSelectorModal({
  visible,
  pages,
  onTogglePage,
  onCancel,
  onExport,
}: Props) {
  const selectedCount = pages.filter((p) => p.selected).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>בחר עמודים לייצוא</Text>

          <ScrollView style={styles.list}>
            {pages.map((page) => (
              <Pressable
                key={page.pageNumber}
                style={styles.item}
                onPress={() => onTogglePage(page.pageNumber)}
              >
                <View style={styles.itemLeft}>
                  <View
                    style={[
                      styles.checkbox,
                      page.selected && styles.checkboxSelected,
                    ]}
                  >
                    {page.selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.itemText}>עמוד {page.pageNumber}</Text>
                </View>

                <View style={styles.itemRight}>
                  {page.hasSignature && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>✍️</Text>
                    </View>
                  )}
                  {page.hasText && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>📝</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={onCancel}
            >
              <Text style={styles.btnText}>ביטול</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={onExport}
              disabled={selectedCount === 0}
            >
              <Text style={styles.btnTextPrimary}>
                ייצא {selectedCount > 0 && `(${selectedCount})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  list: {
    maxHeight: 400,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemRight: {
    flexDirection: "row",
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  itemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  badgeText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btnPrimary: {
    backgroundColor: "#007AFF",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
