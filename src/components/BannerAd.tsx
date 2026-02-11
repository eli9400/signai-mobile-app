import React from "react";
import { View, StyleSheet } from "react-native";
import { AdMobService } from "../services/adMobService";
import { useUserContext } from "../contexts/UserContext";

// Safely import AdMob components
let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  const adModule = require("react-native-google-mobile-ads");
  BannerAd = adModule.BannerAd;
  BannerAdSize = adModule.BannerAdSize;
} catch (error) {
  // AdMob not available
}

export default function BannerAdComponent() {
  const { shouldShowAds } = useUserContext();

  // If user shouldn't see ads (Premium), show nothing
  if (!shouldShowAds) {
    return null;
  }

  // If AdMob is not available (Expo Go), show nothing
  if (!AdMobService.isAvailable() || !BannerAd) {
    return null;
  }

  const adUnitId = AdMobService.getBannerAdUnitId();

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log("Banner ad loaded");
        }}
        onAdFailedToLoad={(error: any) => {
          console.log("Banner ad failed to load:", error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
});
