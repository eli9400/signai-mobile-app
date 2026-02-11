import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { useTranslation } from "react-i18next";
import { httpsCallable } from "firebase/functions";
import Constants from "expo-constants";
import { functions } from "../../firebase";
import { UserService } from "../../services/userService";
import { useUserContext } from "../../contexts/UserContext";
import { styles } from "./BillingModal.styles";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  email: string;
};

export default function BillingModal({ open, onClose, userId, email }: Props) {
  const { t } = useTranslation();
  const { confirmSetupIntent } = useStripe();
  const { refreshUserData } = useUserContext();
  const [cardComplete, setCardComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardStyle = useMemo(
    () => ({
      backgroundColor: "#FFFFFF",
      textColor: "#0F172A",
      placeholderColor: "#94A3B8",
    }),
    [],
  );

  const publishableKey = useMemo(() => {
    const extra =
      Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {};
    return String(extra.stripePublishableKey || "").trim();
  }, []);
  const missingKey =
    !publishableKey || publishableKey.includes("REPLACE_ME");

  const saveDisabled = saving || !cardComplete || !userId || missingKey;

  const handleSaveCard = async () => {
    if (!userId) return;
    if (saveDisabled) return;
    try {
      setSaving(true);
      const createSetupIntent = httpsCallable(functions, "createSetupIntent");
      const res: any = await createSetupIntent({});
      const clientSecret = res?.data?.clientSecret as string | undefined;
      if (!clientSecret) {
        throw new Error("Missing client secret");
      }

      const result = await confirmSetupIntent(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: { email },
        },
      });

      if (result.error) {
        Alert.alert(t("billing.errorTitle"), result.error.message || "");
        return;
      }

      await UserService.setHasPaymentMethod(userId, true);
      await refreshUserData();
      Alert.alert(t("billing.successTitle"), t("billing.successBody"));
      onClose();
    } catch (e: any) {
      Alert.alert(t("billing.errorTitle"), e?.message ?? "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t("billing.title")}</Text>
          <Text style={styles.subtitle}>{t("billing.subtitle")}</Text>
          <Text style={styles.priceNote}>{t("billing.priceNote")}</Text>

          {missingKey ? (
            <Text style={styles.warning}>{t("billing.missingKey")}</Text>
          ) : null}

          <CardField
            postalCodeEnabled={false}
            style={styles.cardField}
            cardStyle={cardStyle}
            onCardChange={(details) => setCardComplete(Boolean(details?.complete))}
          />

          <Pressable
            style={[styles.primaryBtn, saveDisabled && styles.btnDisabled]}
            disabled={saveDisabled}
            onPress={handleSaveCard}
          >
            <Text style={styles.primaryBtnText}>
              {saving ? t("billing.saving") : t("billing.save")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
