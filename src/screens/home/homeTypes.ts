import type { User } from "firebase/auth";

export type HomeScreenProps = {
  user: User | null;
  isGuest?: boolean;
  onSignOut: () => void;
  onUpdateProfile: (displayName: string) => Promise<void> | void;
  onGoAuth: () => void;
  signatureUri: string | null;
  onGoSignature: () => void;
  onGoSignImage: () => void;
  onGoSignPdf: () => void;
  onGoCamera: () => void;
};
