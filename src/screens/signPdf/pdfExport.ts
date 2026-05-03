import { Asset } from "expo-asset";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { type PageEditState, type NormPoint, type NormTextItem } from "./signPdfTypes";
import {
  base64ToUint8,
  clamp01,
  readUriAsBase64,
  uint8ToBase64,
} from "./pdfUtils";

const HEBREW_FONT = require("../../../assets/fonts/David.ttf");

type ExportArgs = {
  pdfBase64: string;
  pagesToExport: number[];
  pageEdits: Record<number, PageEditState>;
  signatureUri: string | null;
  onProgress?: (done: number, total: number) => void;
  t: (key: string, options?: any) => string;
};

async function loadHebrewFontBytes(t: (key: string, options?: any) => string) {
  const asset = Asset.fromModule(HEBREW_FONT);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  const uri = asset.localUri ?? asset.uri;
  const fontB64 = await readUriAsBase64(uri, {
    emptyMsg: t("signPdf.errors.emptyUri"),
    invalidDataUrlMsg: t("signPdf.errors.invalidDataUrl"),
  });

  return base64ToUint8(fontB64);
}

export async function exportStampedPdf({
  pdfBase64,
  pagesToExport,
  pageEdits,
  signatureUri,
  onProgress,
  t,
}: ExportArgs) {
  if (!pdfBase64) throw new Error(t("signPdf.errors.pdfNotLoaded"));

  const pdfDoc = await PDFDocument.load(base64ToUint8(pdfBase64));
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadHebrewFontBytes(t);
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const textColor = rgb(0.06, 0.09, 0.16);

  const total = pagesToExport.length;
  let done = 0;

  // Embed signature image once (optional)
  let sigImg: any = null;
  if (signatureUri) {
    const sigB64 = await readUriAsBase64(signatureUri, {
      emptyMsg: t("signPdf.errors.emptyUri"),
      invalidDataUrlMsg: t("signPdf.errors.invalidDataUrl"),
    });
    const sigBytes = base64ToUint8(sigB64);

    try {
      sigImg = await pdfDoc.embedPng(sigBytes);
    } catch {
      sigImg = await pdfDoc.embedJpg(sigBytes);
    }
  }

  for (const pageNo of pagesToExport) {
    const pageIndex = pageNo - 1;
    const page = pdfDoc.getPage(pageIndex);
    const { width: pw, height: ph } = page.getSize();

    const edit = pageEdits[pageNo];
    if (edit) {
      // --- Signatures ---
      if (sigImg && edit.sigEnabled) {
        for (const s of edit.sigItems ?? []) {
          const w = clamp01(s.size.w) * pw;
          const h = clamp01(s.size.h) * ph;

          const x = clamp01(s.pos.x) * pw;
          const yTop = clamp01(s.pos.y) * ph;
          const y = ph - yTop - h;

          page.drawImage(sigImg, { x, y, width: w, height: h });
        }
      }

      // --- Text helper ---
      const drawName = (txt: string, pos: NormPoint, fontN: number) => {
        const tt = (txt ?? "").trim();
        if (!tt) return;

        const fontSize = Math.max(8, Math.round(clamp01(fontN) * pw));
        const x = clamp01(pos.x) * pw;
        const yTop = clamp01(pos.y) * ph;
        const y = ph - yTop;

        page.drawText(tt, {
          x,
          y: y - fontSize,
          size: fontSize,
          font,
          color: textColor,
          lineHeight: fontSize * 1.15,
          maxWidth: Math.max(24, pw - x),
        });
      };

      const normTextItems: NormTextItem[] = Array.isArray(edit.textItems)
        ? edit.textItems
        : [];

      if (normTextItems.length > 0) {
        for (const textItem of normTextItems) {
          if (!textItem?.text?.trim()) continue;
          drawName(textItem.text, textItem.pos, textItem.fontN);
        }
      } else {
        // Backward compatibility with legacy two-text schema.
        if (edit.name1?.trim() && edit.name1Pos) {
          drawName(edit.name1, edit.name1Pos, edit.name1FontN ?? 0.03);
        }
        if (edit.name2?.trim() && edit.name2Pos) {
          drawName(edit.name2, edit.name2Pos, edit.name2FontN ?? 0.03);
        }
      }
    }

    done += 1;
    onProgress?.(done, total);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

  const outBytes = await pdfDoc.save();
  return uint8ToBase64(outBytes);
}
