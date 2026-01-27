// src/signing/components/SigningToolbar.tsx
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";

type Props = {
  name1: string;
  name2: string;
  setName1: (v: string) => void;
  setName2: (v: string) => void;

  isExporting: boolean;
  canExport: boolean;

  onPickImage: () => void;
  onExport: () => void;
  onBack: () => void;

  // New props for PDF mode
  mode?: "image" | "pdf";
  pickButtonLabel?: string;
};

export default function SigningToolbar({
  name1,
  name2,
  setName1,
  setName2,
  isExporting,
  canExport,
  onPickImage,
  onExport,

  mode = "image",
  pickButtonLabel,
}: Props) {
  const buttonLabel =
    pickButtonLabel || (mode === "pdf" ? "טען PDF אחר" : "בחר תמונה");

  return (
    <View style={styles.container}>
      <View style={styles.inputsRow}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם 1</Text>
          <TextInput
            value={name1}
            onChangeText={setName1}
            placeholder="שם "
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            editable={!isExporting}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם 2</Text>
          <TextInput
            value={name2}
            onChangeText={setName2}
            placeholder="שם נוסף (אופציונלי)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            editable={!isExporting}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          onPress={onPickImage}
          disabled={isExporting}
        >
          <Text style={styles.btnIcon}>📄</Text>
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </Pressable>

        <Pressable
          style={[
            styles.btn,
            styles.btnPrimary,
            (!canExport || isExporting) && styles.btnDisabled,
          ]}
          onPress={onExport}
          disabled={!canExport || isExporting}
        >
          {isExporting ? (
            <View style={styles.row}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.btnText}>מייצא…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.btnIcon}>📤</Text>
              <Text style={styles.btnText}>ייצא</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.hint}>💡 גרור עם אצבע אחת כדי להזיז </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  inputsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputWrap: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btnPrimary: {
    backgroundColor: "#007AFF",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnIcon: {
    fontSize: 16,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
});
