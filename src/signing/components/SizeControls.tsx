import React, { useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = {
  disabled?: boolean;

  // Signature resize
  onSigMinus: () => void;
  onSigPlus: () => void;

  // Text resize (both texts together)
  onTextMinus: () => void;
  onTextPlus: () => void;

  // Optional: hide groups if you want later
  showSignature?: boolean;
  showText?: boolean;
};

export default function SizeControls({
  disabled = false,
  onSigMinus,
  onSigPlus,
  onTextMinus,
  onTextPlus,
  showSignature = true,
  showText = true,
}: Props) {
  const intervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const pressedRef = useRef(false);

  const stopRepeat = () => {
    pressedRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRepeat = (fn: () => void) => {
    if (disabled) return;

    stopRepeat();
    pressedRef.current = true;

    fn(); // ✅ tap קצר עושה שינוי אחד מיד

    timeoutRef.current = setTimeout(() => {
      if (!pressedRef.current) return;

      intervalRef.current = setInterval(() => {
        if (!pressedRef.current) {
          stopRepeat();
          return;
        }
        fn();
      }, 70);
    }, 250);
  };

  return (
    <View style={styles.container}>
      {showSignature && (
        <>
          <Pressable
            style={[styles.btn, disabled && styles.btnDisabled]}
            onPressIn={() => startRepeat(onSigMinus)}
            onPressOut={stopRepeat}
            onTouchCancel={stopRepeat}
            onResponderTerminate={stopRepeat}
            disabled={disabled}
          >
            <Text style={styles.btnText}>✍️−</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, disabled && styles.btnDisabled]}
            onPressIn={() => startRepeat(onSigPlus)}
            onPressOut={stopRepeat}
            onTouchCancel={stopRepeat}
            onResponderTerminate={stopRepeat}
            disabled={disabled}
          >
            <Text style={styles.btnText}>✍️+</Text>
          </Pressable>
        </>
      )}

      {showSignature && showText && <View style={styles.sep} />}

      {showText && (
        <>
          <Pressable
            style={[styles.btn, disabled && styles.btnDisabled]}
            onPressIn={() => startRepeat(onTextMinus)}
            onPressOut={stopRepeat}
            onTouchCancel={stopRepeat}
            onResponderTerminate={stopRepeat}
            disabled={disabled}
          >
            <Text style={styles.btnText}>🔤−</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, disabled && styles.btnDisabled]}
            onPressIn={() => startRepeat(onTextPlus)}
            onPressOut={stopRepeat}
            onTouchCancel={stopRepeat}
            onResponderTerminate={stopRepeat}
            disabled={disabled}
          >
            <Text style={styles.btnText}>🔤+</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  sep: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 6,
  },
});
