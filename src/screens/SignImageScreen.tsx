// src/screens/SignImageScreen.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Platform,
  BackHandler,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import ImageEditor from "../signing/imageFlow/ImageEditor";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
};

type Point = { x: number; y: number };
type Size = { w: number; h: number };

export type ImageEditState = {
  sigEnabled: boolean;
  sigItems: { id: string; pos: Point; size: Size }[];
  activeSigId: string | null;

  name1: string;
  name1Pos: Point;
  name1Font: number;

  name2: string;
  name2Pos: Point;
  name2Font: number;
};

export default function SignImageScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
}: Props) {
  const autoPickedRef = useRef(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const [editState, setEditState] = useState<ImageEditState>({
    sigEnabled: false,
    sigItems: [],
    activeSigId: null,
    name1: "",
    name1Pos: { x: 20, y: 140 },
    name1Font: 28,
    name2: "",
    name2Pos: { x: 20, y: 210 },
    name2Font: 28,
  });

  // Auto-pick image on mount (like PDF does with picker)
  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    if (initialFileUri) return;
    if (imageUri) return;
    if (autoPickedRef.current) return;
    if (isLoading) return;

    autoPickedRef.current = true;
    setTimeout(() => {
      pickImage();
    }, 50);
  }, [initialFileUri, imageUri, isLoading]);

  // Load incoming image from "Open with"
  useEffect(() => {
    if (!initialFileUri) return;
    loadImageUri(initialFileUri);
  }, [initialFileUri]);

  // When image loaded: notify home
  useEffect(() => {
    if (!imageUri) return;
    onFileLoaded?.();
  }, [imageUri, onFileLoaded]);

  const loadImageUri = (uri: string) => {
    setImageUri(uri);
    setImageSize(null);
    setEditState({
      sigEnabled: false,
      sigItems: [],
      activeSigId: null,
      name1: "",
      name1Pos: { x: 20, y: 140 },
      name1Font: 28,
      name2: "",
      name2Pos: { x: 20, y: 210 },
      name2Font: 28,
    });
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("אין הרשאה", "צריך הרשאת גישה לגלריה כדי לבחור תמונה.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;

      loadImageUri(uri);
    } catch (e: any) {
      Alert.alert("שגיאה", e?.message ?? "לא הצלחתי לבחור תמונה");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmExitToHome = useCallback(() => {
    if (!imageUri) {
      onBack();
      return;
    }

    Alert.alert("יציאה מהמסמך", "האם לחזור למסך הראשי?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "חזרה למסך הראשי",
        style: "destructive",
        onPress: onBack,
      },
    ]);
  }, [imageUri, onBack]);

  // Android hardware back
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBack = () => {
      // Let parent handle it (dialog + home)
      return false;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ImageEditor
        imageUri={imageUri}
        imageSize={imageSize}
        setImageSize={setImageSize}
        isLoading={isLoading}
        onClose={confirmExitToHome}
        onPickImage={pickImage}
        signatureUri={signatureUri}
        editState={editState}
        setEditState={setEditState}
      />
    </SafeAreaView>
  );
}
