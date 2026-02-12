import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { type Purchase, useIAP } from "react-native-iap";
import { UserService } from "../../services/userService";
import { useUserContext } from "../../contexts/UserContext";
import { styles } from "./BillingModal.styles";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
};

// Keep these SKUs in sync with Play Console product IDs.
const CREDIT_PRODUCTS = [
  {
    sku: "credit_1",
    credits: 1,
    titleKey: "billing.productOneTitle",
    subtitleKey: "billing.productOneSubtitle",
    fallbackPrice: "1",
  },
  {
    sku: "credit_10",
    credits: 10,
    titleKey: "billing.productTenTitle",
    subtitleKey: "billing.productTenSubtitle",
    fallbackPrice: "8",
  },
] as const;

export default function BillingModal({ open, onClose, userId }: Props) {
  const { t } = useTranslation();
  const { refreshUserData } = useUserContext();
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [buyingSku, setBuyingSku] = useState<string | null>(null);
  const [completingPurchase, setCompletingPurchase] = useState(false);

  const productIds = useMemo(
    () => CREDIT_PRODUCTS.map((item) => item.sku),
    [],
  );

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      if (!userId) {
        Alert.alert(t("billing.errorTitle"), t("billing.signInRequired"));
        return;
      }
      const matched = CREDIT_PRODUCTS.find(
        (item) => item.sku === purchase.productId,
      );
      if (!matched) {
        Alert.alert(t("billing.errorTitle"), t("billing.errorUnknownProduct"));
        return;
      }

      try {
        setCompletingPurchase(true);
        await UserService.addCredits(userId, matched.credits);
        await finishTransaction({ purchase, isConsumable: true });
        await refreshUserData();
        Alert.alert(
          t("billing.successTitle"),
          t("billing.successBody", { count: matched.credits }),
        );
        onClose();
      } catch (e: any) {
        Alert.alert(t("billing.errorTitle"), e?.message ?? "");
      } finally {
        setCompletingPurchase(false);
        setBuyingSku(null);
      }
    },
    onPurchaseError: (error) => {
      setBuyingSku(null);
      Alert.alert(t("billing.errorTitle"), error?.message ?? "");
    },
    onError: (error) => {
      setBuyingSku(null);
      Alert.alert(t("billing.errorTitle"), error?.message ?? "");
    },
  });

  useEffect(() => {
    if (!open || !connected) return;
    let active = true;
    setLoadingProducts(true);
    fetchProducts({ skus: productIds, type: "in-app" })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, [open, connected, fetchProducts, productIds]);

  useEffect(() => {
    if (open) return;
    setBuyingSku(null);
    setCompletingPurchase(false);
    setLoadingProducts(false);
  }, [open]);

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const handleBuy = async (sku: string) => {
    const product = productsById.get(sku);
    if (!userId) {
      Alert.alert(t("billing.errorTitle"), t("billing.signInRequired"));
      return;
    }
    if (!connected) {
      Alert.alert(t("billing.errorTitle"), t("billing.storeUnavailable"));
      return;
    }
    if (!product) {
      Alert.alert(t("billing.errorTitle"), t("billing.productUnavailable"));
      return;
    }
    if (buyingSku || completingPurchase) return;
    setBuyingSku(sku);
    try {
      await requestPurchase({
        type: "in-app",
        request: {
          google: { skus: [sku] },
          apple: { sku },
        },
      });
    } catch (e: any) {
      setBuyingSku(null);
      Alert.alert(t("billing.errorTitle"), e?.message ?? "");
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

          {!connected ? (
            <Text style={styles.warning}>{t("billing.storeUnavailable")}</Text>
          ) : null}

          {loadingProducts ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#475569" />
              <Text style={styles.loadingText}>{t("billing.loading")}</Text>
            </View>
          ) : null}

          {connected && !loadingProducts && products.length === 0 ? (
            <Text style={styles.warning}>{t("billing.noProducts")}</Text>
          ) : null}

          <View style={styles.productsWrap}>
            {CREDIT_PRODUCTS.map((item, index) => {
              const product = productsById.get(item.sku);
              const priceLabel = product?.displayPrice || item.fallbackPrice;
              const isBusy = buyingSku === item.sku || completingPurchase;
              const disabled = !connected || isBusy || !product;

              return (
                <Pressable
                  key={item.sku}
                  style={[
                    styles.productBtn,
                    index > 0 && styles.productBtnSpacing,
                    disabled && styles.btnDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => handleBuy(item.sku)}
                >
                  <View style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle}>
                        {t(item.titleKey)}
                      </Text>
                      <Text style={styles.productSubtitle}>
                        {t(item.subtitleKey)}
                      </Text>
                    </View>
                    <Text style={styles.productPrice}>
                      {!product
                        ? t("billing.productUnavailable")
                        : isBusy
                          ? t("billing.processing")
                          : priceLabel}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
