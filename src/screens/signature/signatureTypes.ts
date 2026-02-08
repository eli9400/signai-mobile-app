import type { SignatureScope } from "../../storage/signatureStore";

export type SignatureScreenProps = {
  onDone: () => void;
  signatureScope: SignatureScope;
};
