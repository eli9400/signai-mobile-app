import { Platform } from "react-native";

// Safely import AdMob - will be null in Expo Go
let mobileAds: any = null;
let MaxAdContentRating: any = null;

try {
  const adModule = require("react-native-google-mobile-ads");
  mobileAds = adModule.default;
  MaxAdContentRating = adModule.MaxAdContentRating;
} catch (error) {
  console.log("AdMob not available (running in Expo Go)");
}

// Check if AdMob is available
const isAdMobAvailable = () => {
  return mobileAds !== null;
};

// Ad Unit IDs from app.json
let BANNER_AD_UNIT_ID = "";
let INTERSTITIAL_AD_UNIT_ID = "";

try {
  const Constants = require("expo-constants").default;
  BANNER_AD_UNIT_ID = Constants.expoConfig?.extra?.adMobBannerAdUnitId || "";
  INTERSTITIAL_AD_UNIT_ID =
    Constants.expoConfig?.extra?.adMobInterstitialAdUnitId || "";
} catch (error) {
  console.log("Constants not available");
}

// Check environment variable set in eas.json
// This will be automatically injected during build
const USE_PRODUCTION_ADS =
  process.env.EXPO_PUBLIC_USE_PRODUCTION_ADS === "true";

// Test Ad Unit IDs (for development)
const TEST_BANNER_AD_UNIT_ID =
  Platform.select({
    ios: "ca-app-pub-3940256099942544/2934735716",
    android: "ca-app-pub-3940256099942544/6300978111",
  }) || "";

const TEST_INTERSTITIAL_AD_UNIT_ID =
  Platform.select({
    ios: "ca-app-pub-3940256099942544/4411468910",
    android: "ca-app-pub-3940256099942544/1033173712",
  }) || "";

// Check if we should use production ads
// This is controlled by the USE_PRODUCTION_ADS environment variable in eas.json
const shouldUseProductionAds = () => {
  return USE_PRODUCTION_ADS;
};

export const AdMobService = {
  // Check if AdMob is available
  isAvailable: isAdMobAvailable,

  // Initialize AdMob
  initialize: async () => {
    if (!isAdMobAvailable()) {
      console.log("AdMob not available - skipping initialization");
      return false;
    }

    try {
      await mobileAds().initialize();

      // Set request configuration
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      console.log("AdMob initialized successfully");
      console.log("Using production ads:", shouldUseProductionAds());
      return true;
    } catch (error) {
      console.error("AdMob initialization error:", error);
      return false;
    }
  },

  // Get Banner Ad Unit ID
  getBannerAdUnitId: () => {
    return shouldUseProductionAds()
      ? BANNER_AD_UNIT_ID
      : TEST_BANNER_AD_UNIT_ID;
  },

  // Get Interstitial Ad Unit ID
  getInterstitialAdUnitId: () => {
    return shouldUseProductionAds()
      ? INTERSTITIAL_AD_UNIT_ID
      : TEST_INTERSTITIAL_AD_UNIT_ID;
  },
};
