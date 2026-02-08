import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#6d28d9",
    elevation: 4,
  },
  exportBtnDis: { opacity: 0.45 },
  exportBtnText: { color: "#fff", fontWeight: "900" },
});
