// src/screens/SignImageScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Platform, BackHandler, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import ImageEditor from "../signing/imageFlow/ImageEditor";
import {
  createInitialEditState,
  type ImageEditState,
} from "./signImage/signImageState";
import { useInterstitialAd } from "../hooks/useInterstitialAd";
import { useUserContext } from "../contexts/UserContext";

type Props = {
  signatureUri: string | null;
  onBack: () => void;
  initialFileUri?: string | null;
  onFileLoaded?: () => void;
  useCamera?: boolean;
};

export default function SignImageScreen({
  signatureUri,
  onBack,
  initialFileUri,
  onFileLoaded,
  useCamera = false,
}: Props) {
  const { t } = useTranslation();
  const { showAd } = useInterstitialAd();
  const { consumeAction, canUse, loading: userLoading } = useUserContext();

  const autoPickedRef = useRef(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const [editState, setEditState] = useState<ImageEditState>(
    createInitialEditState(),
  );

  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    if (initialFileUri) return;
    if (imageUri) return;
    if (autoPickedRef.current) return;
    if (isLoading) return;

    autoPickedRef.current = true;
    setTimeout(() => {
      if (useCamera) {
        takePhoto();
      } else {
        pickImage();
      }
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFileUri, imageUri, isLoading, useCamera]);

  useEffect(() => {
    if (!initialFileUri) return;
    loadImageUri(initialFileUri);
  }, [initialFileUri]);

  useEffect(() => {
    if (!imageUri) return;
    onFileLoaded?.();
  }, [imageUri, onFileLoaded]);

  const loadImageUri = (uri: string) => {
    setImageUri(uri);
    setImageSize(null);
    setEditState(createInitialEditState());
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          t("signImage.alerts.noPermissionTitle"),
          t("signImage.alerts.galleryPermissionBody"),
        );
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
      Alert.alert(
        t("common.alerts.errorTitle"),
        e?.message ?? t("signImage.alerts.pickFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          t("signImage.alerts.noPermissionTitle"),
          t("signImage.alerts.cameraPermissionBody"),
        );
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
      });

      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;

      loadImageUri(uri);
    } catch (e: any) {
      Alert.alert(
        t("common.alerts.errorTitle"),
        e?.message ?? t("signImage.alerts.cameraFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const confirmExitToHome = useCallback(() => {
    if (!imageUri) {
      onBack();
      return;
    }

    Alert.alert(t("common.alerts.exitTitle"), t("common.alerts.exitBody"), [
      { text: t("common.actions.cancel"), style: "cancel" },
      {
        text: t("common.actions.backToHome"),
        style: "destructive",
        onPress: onBack,
      },
    ]);
  }, [imageUri, onBack, t]);

  const handleExportComplete = useCallback(async () => {
    await consumeAction();
    showAd();
    onBack();
  }, [consumeAction, showAd, onBack]);

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
        onExportComplete={handleExportComplete}
        canUseAction={userLoading ? true : canUse}
      />
    </SafeAreaView>
  );
}
