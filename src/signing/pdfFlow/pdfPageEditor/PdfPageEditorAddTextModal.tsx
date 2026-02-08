import { Modal, Text, TextInput, View, Pressable } from "react-native";
import { styles } from "./PdfPageEditor.styles";

type Props = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  placeholder: string;
  cancelLabel: string;
  confirmLabel: string;
  hint: string;
};

export default function PdfPageEditorAddTextModal({
  open,
  value,
  onChange,
  onCancel,
  onConfirm,
  title,
  placeholder,
  cancelLabel,
  confirmLabel,
  hint,
}: Props) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#777"
            autoFocus
            multiline
            style={styles.modalInput}
          />
          <View style={styles.modalRow}>
            <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={onCancel}>
              <Text style={styles.modalCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[styles.modalBtn, styles.modalOk]} onPress={onConfirm}>
              <Text style={styles.modalOkText}>{confirmLabel}</Text>
            </Pressable>
          </View>
          <Text style={styles.modalHint}>{hint}</Text>
        </View>
      </View>
    </Modal>
  );
}
