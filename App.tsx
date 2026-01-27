// App.tsx
import React from "react";
import { ShareIntentProvider } from "expo-share-intent";
import AppInner from "./src/AppInner";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <ShareIntentProvider>
        <AppInner />
      </ShareIntentProvider>
    </SafeAreaProvider>
  );
}
