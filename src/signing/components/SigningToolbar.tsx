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
  onBack,
}: Props) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>חתימה + שמות</Text>
        <Text style={styles.sub}>
          אצבע אחת = הזזה | שתי אצבעות = שינוי גודל
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={onPickImage}
          disabled={isExporting}
        >
          <Text style={styles.btnText}>בחר תמונה</Text>
        </Pressable>

        <Pressable
          style={[
            styles.btn,
            styles.exportBtn,
            (!canExport || isExporting) && styles.btnDisabled,
          ]}
          onPress={onExport}
          disabled={!canExport || isExporting}
        >
          {isExporting ? (
            <View style={styles.exportLoading}>
              <ActivityIndicator />
              <Text style={styles.btnText}>מייצא…</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>ייצא ושתף</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.btn, styles.backBtn]}
          onPress={onBack}
          disabled={isExporting}
        >
          <Text style={styles.btnText}>חזרה</Text>
        </Pressable>
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם1</Text>
          <TextInput
            value={name1}
            onChangeText={setName1}
            placeholder="לדוגמה: שם מלא"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            editable={!isExporting}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>שם2</Text>
          <TextInput
            value={name2}
            onChangeText={setName2}
            placeholder="לדוגמה: תפקיד/מחלקה"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            editable={!isExporting}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 12 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "white", opacity: 0.7, lineHeight: 18 },

  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  btn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exportBtn: { backgroundColor: "#3a3a3a" },
  backBtn: { backgroundColor: "#1b1b1b" },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "white", fontWeight: "700" },
  exportLoading: { flexDirection: "row", gap: 8, alignItems: "center" },

  inputsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  inputWrap: { flex: 1, gap: 6 },
  inputLabel: { color: "white", opacity: 0.75, fontSize: 12 },
  input: {
    backgroundColor: "#161616",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
});
