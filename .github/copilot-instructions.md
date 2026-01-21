# Copilot Instructions for signai Mobile App

## Project Overview
- This is a React Native (TypeScript) mobile app for capturing, displaying, and storing user signatures.
- Main app entry: [App.tsx](../App.tsx)
- Screens are organized in [src/screens/](../src/screens/):
  - `HomeScreen.tsx`: Main navigation hub
  - `SignatureScreen.tsx`: Signature capture
  - `SignImageScreen.tsx`: Displays saved signature images
- Signature drawing UI: [src/ui/SignaturePad.tsx](../src/ui/SignaturePad.tsx)
- Signature storage logic: [src/storage/signatureStore.ts](../src/storage/signatureStore.ts)

## Architecture & Data Flow
- Uses a screen-based navigation pattern (likely React Navigation, check [App.tsx](../App.tsx)).
- User draws a signature in `SignaturePad`, which is managed by `SignatureScreen`.
- Signatures are saved and retrieved via `signatureStore` (local storage abstraction).
- Images are displayed in `SignImageScreen`.

## Developer Workflows
- **Start app (Expo):**
  ```
  npx expo start
  ```
- **TypeScript:**
  - Config: [tsconfig.json](../tsconfig.json)
- **Dependencies:**
  - Managed in [package.json](../package.json)
  - Likely uses Expo and React Native libraries

## Project Conventions
- All business logic for signature storage is in `signatureStore.ts`.
- UI components are in `src/ui/`, screens in `src/screens/`.
- Use TypeScript types for all component props and state.
- Prefer functional components and React hooks.
- Keep navigation logic in `App.tsx`.

## Integration Points
- Local storage (AsyncStorage or similar) for signature persistence.
- No backend integration by default (unless added later).

## Examples
- To add a new screen: create a file in `src/screens/`, add to navigation in `App.tsx`.
- To update signature logic: edit `signatureStore.ts` and update consumers in screens/components.

## References
- [App.tsx](../App.tsx): App entry, navigation setup
- [src/screens/](../src/screens/): All screens
- [src/ui/SignaturePad.tsx](../src/ui/SignaturePad.tsx): Drawing UI
- [src/storage/signatureStore.ts](../src/storage/signatureStore.ts): Storage logic

---
For more details, review the referenced files. Update this guide if major architectural or workflow changes are made.
