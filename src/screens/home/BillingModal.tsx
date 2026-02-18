import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { type Purchase, useIAP } from "react-native-iap";
import Constants from "expo-constants";
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

const PREMIUM_SUBSCRIPTION = {
  sku: "premium_monthly",
  titleKey: "billing.premiumTitle",
  subtitleKey: "billing.premiumSubtitle",
  fallbackPrice: "19.99",
} as const;

export default function BillingModal({ open, onClose, userId }: Props) {
  const { t } = useTranslation();
  const { refreshUserData, userData } = useUserContext();
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [buyingSku, setBuyingSku] = useState<string | null>(null);
  const [completingPurchase, setCompletingPurchase] = useState(false);
  const handledPurchasesRef = useRef<Set<string>>(new Set());

  const productIds = useMemo(
    () => CREDIT_PRODUCTS.map((item) => item.sku),
    [],
  );
  const subscriptionIds = useMemo(() => [PREMIUM_SUBSCRIPTION.sku], []);

  const premiumExpiry = userData?.premiumExpiresAt?.toDate?.() ?? null;
  const premiumActive =
    Boolean(premiumExpiry) && premiumExpiry ? premiumExpiry > new Date() : false;
  const premiumExpiryLabel = premiumExpiry
    ? premiumExpiry.toLocaleDateString()
    : "";
  const packageName = Constants.expoConfig?.android?.package ?? "";

  const {
    connected,
    products,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      const purchaseId =
        purchase.id || purchase.purchaseToken || purchase.productId;
      if (handledPurchasesRef.current.has(purchaseId)) {
        return;
      }
      handledPurchasesRef.current.add(purchaseId);

      if (!userId) {
        Alert.alert(t("billing.errorTitle"), t("billing.signInRequired"));
        return;
      }
      const matchedCredit = CREDIT_PRODUCTS.find(
        (item) => item.sku === purchase.productId,
      );

      try {
        setCompletingPurchase(true);

        if (matchedCredit) {
          await UserService.addCredits(userId, matchedCredit.credits);
          await finishTransaction({ purchase, isConsumable: true });
          await refreshUserData();
          Alert.alert(
            t("billing.successTitle"),
            t("billing.successBody", { count: matchedCredit.credits }),
          );
          onClose();
          return;
        }

        if (purchase.productId === PREMIUM_SUBSCRIPTION.sku) {
          await UserService.upgradeToPremium(userId, 30);
          await finishTransaction({ purchase, isConsumable: false });
          await refreshUserData();
          Alert.alert(
            t("billing.successTitle"),
            t("billing.premiumSuccessBody"),
          );
          onClose();
          return;
        }

        Alert.alert(t("billing.errorTitle"), t("billing.errorUnknownProduct"));
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
    Promise.all([
      fetchProducts({ skus: productIds, type: "in-app" }),
      fetchProducts({ skus: subscriptionIds, type: "subs" }),
    ])
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, [open, connected, fetchProducts, productIds, subscriptionIds]);

  useEffect(() => {
    if (open) return;
    setBuyingSku(null);
    setCompletingPurchase(false);
    setLoadingProducts(false);
  }, [open]);

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);
  const subscriptionsById = useMemo(() => {
    return new Map(subscriptions.map((product) => [product.id, product]));
  }, [subscriptions]);

  const handleBuyCredit = async (sku: string) => {
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

  const handleBuyPremium = async () => {
    const product = subscriptionsById.get(PREMIUM_SUBSCRIPTION.sku);
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
    if (premiumActive) {
      Alert.alert(
        t("billing.successTitle"),
        t("billing.premiumActive", { date: premiumExpiryLabel }),
      );
      return;
    }
    if (buyingSku || completingPurchase) return;
    setBuyingSku(PREMIUM_SUBSCRIPTION.sku);
    try {
      await requestPurchase({
        type: "subs",
        request: {
          google: { skus: [PREMIUM_SUBSCRIPTION.sku] },
          apple: { sku: PREMIUM_SUBSCRIPTION.sku },
        },
      });
    } catch (e: any) {
      setBuyingSku(null);
      Alert.alert(t("billing.errorTitle"), e?.message ?? "");
    }
  };

  const handleManageSubscription = async () => {
    if (!packageName) {
      Alert.alert(t("billing.errorTitle"), t("billing.storeUnavailable"));
      return;
    }
    const url = `https://play.google.com/store/account/subscriptions?package=${packageName}&sku=${PREMIUM_SUBSCRIPTION.sku}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t("billing.errorTitle"), t("billing.storeUnavailable"));
      return;
    }
    await Linking.openURL(url);
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
          <Text style={styles.title}>
            {premiumActive ? t("billing.premiumTitle") : t("billing.title")}
          </Text>
          <Text style={styles.subtitle}>
            {premiumActive
              ? t("billing.premiumSubtitle")
              : t("billing.subtitle")}
          </Text>
          {!premiumActive ? (
            <Text style={styles.priceNote}>{t("billing.priceNote")}</Text>
          ) : null}

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

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("billing.premiumSection")}</Text>
            {premiumActive ? (
              <Text style={styles.sectionSubtitle}>
                {t("billing.premiumActive", { date: premiumExpiryLabel })}
              </Text>
            ) : null}
          </View>

          <Pressable
            style={[
              styles.productBtn,
              styles.premiumBtn,
              (!subscriptionsById.get(PREMIUM_SUBSCRIPTION.sku) ||
                premiumActive) &&
                styles.btnDisabled,
            ]}
            disabled={
              !subscriptionsById.get(PREMIUM_SUBSCRIPTION.sku) || premiumActive
            }
            onPress={handleBuyPremium}
          >
            <View style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>
                  {t(PREMIUM_SUBSCRIPTION.titleKey)}
                </Text>
                <Text style={styles.productSubtitle}>
                  {t(PREMIUM_SUBSCRIPTION.subtitleKey)}
                </Text>
              </View>
              <Text style={styles.productPrice}>
                {!subscriptionsById.get(PREMIUM_SUBSCRIPTION.sku)
                  ? t("billing.productUnavailable")
                  : buyingSku === PREMIUM_SUBSCRIPTION.sku ||
                      completingPurchase
                    ? t("billing.processing")
                    : subscriptionsById.get(PREMIUM_SUBSCRIPTION.sku)
                        ?.displayPrice || PREMIUM_SUBSCRIPTION.fallbackPrice}
              </Text>
            </View>
          </Pressable>

          {premiumActive ? (
            <>
              <Pressable
                style={[styles.productBtn, styles.dangerBtn]}
                onPress={handleManageSubscription}
              >
                <Text style={styles.dangerText}>
                  {t("billing.cancelPremium")}
                </Text>
              </Pressable>
              <Text style={styles.dangerHint}>
                {t("billing.cancelPremiumHint")}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t("billing.creditsSection")}
                </Text>
              </View>

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
                      onPress={() => handleBuyCredit(item.sku)}
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
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
