// App.tsx
import React from "react";
import { ShareIntentProvider } from "expo-share-intent";
import AppInner from "./src/AppInner";

export default function App() {
  return (
    <ShareIntentProvider>
      <AppInner />
    </ShareIntentProvider>
  );
}
