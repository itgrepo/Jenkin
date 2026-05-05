import { PDFDocument, rgb } from "pdf-lib";
import fontKit from "@pdf-lib/fontkit";

const MARGIN = 50;
const FONT_SIZE = 14;

const THAI_FONT_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf";

let cachedFontBytes: Uint8Array | null = null;

async function getThaiFontBytes(): Promise<Uint8Array> {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch(THAI_FONT_URL);
  if (!res.ok) throw new Error(`Failed to fetch font: HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  cachedFontBytes = new Uint8Array(ab);
  return cachedFontBytes;
}

/**
 * Stamp nLabel on every page of the PDF, top-right.
 * Uses Sarabun (Thai-supporting font). Whatever string is passed is stamped as-is.
 */
export async function stampPdfWithNLabel(
  pdfBytes: ArrayBuffer,
  nLabel: string
): Promise<Uint8Array> {
  if (!nLabel.trim()) return new Uint8Array(pdfBytes);

  const doc = await PDFDocument.load(pdfBytes);
  doc.registerFontkit(fontKit);

  const pages = doc.getPages();
  if (pages.length === 0) return new Uint8Array(pdfBytes);

  const fontBytes = await getThaiFontBytes();
  const font = await doc.embedFont(fontBytes);
  const textWidth = font.widthOfTextAtSize(nLabel, FONT_SIZE);

  for (const page of pages) {
    const w = page.getWidth();
    const h = page.getHeight();
    const x = Math.max(0, w - MARGIN - textWidth);
    const y = h - MARGIN - FONT_SIZE;

    page.drawText(nLabel, {
      x,
      y,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return doc.save();
}
