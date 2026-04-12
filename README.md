# QuickSign

A React Native mobile app for signing PDFs and images directly from your phone.

QuickSign lets users create and save a signature, open PDF or image files, place signatures and text overlays, and export the final signed document for sharing. The app also supports opening files directly from Android share/open intents, making the signing flow fast and practical for real-world use.

---

## Overview

QuickSign is built for users who need a simple way to sign documents and images on mobile without switching between multiple tools.

The app supports:

* Signing PDF files
* Signing image files
* Importing files from the device or camera
* Receiving files from Android "Open with" / share flows
* Exporting and sharing signed results
* Authentication and guest mode
* Multi-language support

---

## Key Features

* Sign both PDFs and images
* Create and store a reusable signature
* Add overlays on top of documents
* Export signed PDFs
* Export and share signed images
* Open incoming files through Android intent filters
* Camera support for signing captured images
* Guest mode and authenticated mode
* Multi-language UI (Hebrew, English, Russian, Arabic)
* Firebase-backed user state
* Monetization hooks (AdMob + in-app purchases)

---

## Tech Stack

Frontend (Mobile):

* React Native
* Expo
* TypeScript

Document & Image Processing:

* pdf-lib
* react-native-webview
* react-native-view-shot

Device & Native Integration:

* expo-document-picker
* expo-image-picker
* expo-file-system
* expo-share-intent
* expo-sharing
* expo-linking

Backend & Services:

* Firebase
* Firebase Cloud Functions
* Firestore
* Stripe

Libraries:

* i18next / react-i18next
* react-native-safe-area-context
* react-native-google-mobile-ads
* react-native-iap

---

## How It Works

1. User enters the app (guest or authenticated)
2. Creates or loads a signature
3. Chooses to sign:

   * PDF
   * Image
   * Camera photo
4. File is loaded into the editor
5. User places signature and overlays
6. Document is exported and shared

---

## Project Structure

signai-mobile-app/
├── App.tsx
├── app.json
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── signImage/
│   │   ├── signPdf/
│   │   └── signature/
│   ├── signing/
│   ├── services/
│   ├── firebase/
│   ├── hooks/
│   ├── components/
│   ├── utils/
│   └── ui/
├── functions/
└── legal-pages/

---

## Getting Started

Clone the repository:
git clone https://github.com/eli9400/signai-mobile-app.git
cd signai-mobile-app

Install dependencies:
npm install

Install backend (Firebase functions):
cd functions
npm install
cd ..

Run the app:
npm start

Run on Android:
npm run android

Run on iOS:
npm run ios

---

## Environment Notes

Before running in production, configure:

* Firebase project
* google-services.json
* Stripe keys
* AdMob configuration
* In-app purchases

---

## Highlights

* Real-world mobile signing solution
* Supports both PDF and image workflows
* Handles Android share/open file flows
* Full end-to-end signing experience
* Modular architecture with clean separation of concerns
* Integrated Firebase + Stripe backend

---

## Future Improvements

* Cloud sync for signed documents
* Advanced PDF annotation tools
* OCR-based field detection
* Better subscription management
* Collaboration features

---

## Author

Eli Blechman
https://github.com/eli9400
