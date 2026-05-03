import type { Dispatch, SetStateAction } from "react";
import type { ImageEditState } from "../../../screens/signImage/signImageState";

export type ImageSize = { w: number; h: number };

export type ImageEditorProps = {
  imageUri: string | null;
  imageSize: ImageSize | null;
  setImageSize: Dispatch<SetStateAction<ImageSize | null>>;
  isLoading: boolean;
  onClose: () => void;
  onPickImage: () => void;
  signatureUri: string | null;
  editState: ImageEditState;
  setEditState: Dispatch<SetStateAction<ImageEditState>>;
  onExportComplete?: () => void;
  canUseAction?: boolean;
};
