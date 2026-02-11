// App.tsx
import React from "react";
import { ShareIntentProvider } from "expo-share-intent";
import AppInner from "./src/AppInner";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

export default function App() {
  const extra =
    Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {};
  const publishableKey = String(extra.stripePublishableKey || "").trim();
  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={publishableKey}
        urlScheme={Constants.expoConfig?.scheme ?? "quicksign"}
      >
        <ShareIntentProvider>
          <AppInner />
        </ShareIntentProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
