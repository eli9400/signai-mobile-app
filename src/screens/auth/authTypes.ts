export type GoogleAuthMode = "signIn" | "signUp";

export type AuthScreenProps = {
  onEmailSignIn: (email: string, password: string) => Promise<void> | void;
  onEmailSignUp: (name: string, email: string, password: string) => Promise<void> | void;
  onGoogleSignIn: (mode: GoogleAuthMode) => Promise<void> | void;
  onContinueAsGuest: () => void;
  onClearError?: () => void;
  loading?: boolean;
  error?: string | null;
};
