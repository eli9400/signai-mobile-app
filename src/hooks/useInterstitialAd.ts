import { useEffect, useState } from "react";
import { AdMobService } from "../services/adMobService";
import { useUserContext } from "../contexts/UserContext";

// Safely import AdMob
let InterstitialAd: any = null;
let AdEventType: any = null;

try {
  const adModule = require("react-native-google-mobile-ads");
  InterstitialAd = adModule.InterstitialAd;
  AdEventType = adModule.AdEventType;
} catch (error) {
  // AdMob not available
}

export function useInterstitialAd() {
  const { shouldShowAds } = useUserContext();
  const [interstitialAd, setInterstitialAd] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // If user shouldn't see ads (Premium), skip initialization
    if (!shouldShowAds) {
      console.log("User is Premium - skipping interstitial ad");
      return;
    }

    // If AdMob is not available, skip initialization
    if (!AdMobService.isAvailable() || !InterstitialAd) {
      console.log("Interstitial ads not available (running in Expo Go)");
      return;
    }

    const adUnitId = AdMobService.getInterstitialAdUnitId();
    const ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Listen for ad loaded event
    const loadedListener = ad.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
      console.log("Interstitial ad loaded");
    });

    // Listen for ad closed event
    const closedListener = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      console.log("Interstitial ad closed");
      // Load a new ad for next time
      ad.load();
    });

    // Listen for ad failed to load
    const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.log("Interstitial ad failed to load:", error);
      setLoaded(false);
    });

    // Load the ad
    ad.load();
    setInterstitialAd(ad);

    // Cleanup
    return () => {
      loadedListener();
      closedListener();
      errorListener();
    };
  }, [shouldShowAds]);

  const showAd = async () => {
    // If user shouldn't see ads (Premium), do nothing
    if (!shouldShowAds) {
      console.log("User is Premium - skipping interstitial ad");
      return;
    }

    // If AdMob is not available, do nothing
    if (!AdMobService.isAvailable()) {
      console.log("Interstitial ads not available - skipping");
      return;
    }

    if (loaded && interstitialAd) {
      try {
        await interstitialAd.show();
      } catch (error) {
        console.log("Error showing interstitial ad:", error);
      }
    } else {
      console.log("Interstitial ad not loaded yet");
    }
  };

  return {
    showAd,
    loaded,
  };
}
