/** 203 DPI thermal heads: label geometry is expressed in print dots. */
export const PRINT_DOTS_PER_MM = 8;

// Mirrors LabelBuilder::layout() in app/Services/Printing/LabelBuilder.php: keep both in sync so the
// fallback preview shows the geometry the label printer actually receives. The backend measures
// glyph boxes with imagettfbbox; here charUnits() approximates Tahoma, so this renderer stands in
// only until the server-side PNG arrives.
const ROW_GAP_DOTS = 8;
const GAP_MAX_DOTS = 24;
const MARGIN_DOTS = 8;

export interface LabelLayoutOptions {
  widthMm: number;
  heightMm: number;
  barcodeHeightDots: number;
  showStoreName: boolean;
  showPrice: boolean;
  showSku: boolean;
  showBarcodeText: boolean;
}

export type LayoutRow =
  | { type: 'text'; text: string; px: number; bold: boolean; x: number; y: number; width: number; height: number }
  | {
      type: 'barcode';
      code: string;
      x: number;
      y: number;
      width: number;
      height: number;
      readableHeight: number;
      readablePx: number;
      narrow: number;
    };

export interface LabelLayout {
  widthDots: number;
  heightDots: number;
  rows: LayoutRow[];
  overflow: boolean;
}

export interface LabelPayload {
  storeName?: string;
  name?: string;
  price?: string;
  barcode?: string;
  sku?: string;
  unit?: string;
}

/** Only these fields reach the paper, so only these identify a rendered label. */
export function labelPrintableKey(item: LabelPayload): string {
  return JSON.stringify([item.storeName ?? '', item.name ?? '', item.price ?? '', item.barcode ?? '', item.sku ?? '', item.unit ?? '']);
}

export function hashKey(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  }

  return (hash >>> 0).toString(36);
}

const clean = (value: string) => value.replace(/"/g, '');

/** Approximate Tahoma advance widths in em units; bold adds a little to every glyph. */
function charUnits(ch: string, bold: boolean): number {
  let units: number;
  if (ch === ' ') units = 0.32;
  else if ('il.,:;!\'`|()-'.includes(ch) || 'jiftI[]{}'.includes(ch)) units = 0.3;
  else if ('mw'.includes(ch)) units = 0.75;
  else if ('MW'.includes(ch)) units = 0.93;
  else if (/[0-9]/.test(ch)) units = 0.6;
  else if (/[A-Z]/.test(ch)) units = 0.66;
  else units = 0.55;

  return units + (bold ? 0.04 : 0);
}

/** Estimated dot width of a line drawn at the given pixel size. */
export function textWidthDots(text: string, px: number, bold = false): number {
  let units = 0;
  for (const ch of text) units += charUnits(ch, bold);

  return Math.max(1, Math.round(units * px));
}

const lineHeightDots = (px: number) => Math.round(px * 1.5);

/** Greedy word wrap into at most maxLines pixel-fitted lines; over-wide words are hard-split. */
function wrapText(text: string, maxWidth: number, px: number, bold: boolean, maxLines: number): string[] {
  const fits = (candidate: string) => textWidthDots(candidate, px, bold) <= maxWidth;
  // A parenthesized group such as "(per piece)" is one word, so a line never ends on "(per".
  const words = text.trim().match(/\([^()]*\)|\S+/g) ?? [];
  if (words.length === 0) return [];
  if (fits(words.join(' '))) return [words.join(' ')];

  const lines: string[] = [];
  let current = '';
  for (let word of words) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (fits(candidate)) {
      current = candidate;
      continue;
    }
    if (current !== '') {
      lines.push(current);
      if (lines.length === maxLines) return lines;
    }
    // A single word wider than a line is cut by characters, not clipped.
    while (Array.from(word).length > 1 && !fits(word)) {
      const chars = Array.from(word);
      let cut = chars.length - 1;
      while (cut > 1 && !fits(chars.slice(0, cut).join(''))) cut--;
      lines.push(chars.slice(0, cut).join(''));
      if (lines.length === maxLines) return lines;
      word = chars.slice(cut).join('');
    }
    current = word;
  }
  if (current !== '' && lines.length < maxLines) lines.push(current);

  return lines;
}

/**
 * "Name (unit)" that still shows the unit when the name is too long for two lines: the name
 * loses its last words and gets an ellipsis, the unit is never the part cut.
 */
function nameWithUnit(name: string, unit: string, width: number, px: number): string {
  if (!unit) return name;
  if (!name) return unit;

  const suffix = ` (${unit})`;
  const words = name.trim().split(/\s+/);
  for (let keep = words.length; keep >= 1; keep--) {
    const candidate = `${words.slice(0, keep).join(' ')}${keep < words.length ? '…' : ''}${suffix}`;
    // Asking for one line more than shown reveals whether anything would be dropped.
    if (wrapText(candidate, width, px, true, 3).length <= 2) return candidate;
  }

  return suffix.trim();
}

type TextDraft = { kind: 'storeName' | 'name' | 'price' | 'sku'; text: string; px: number; bold: boolean; maxLines: number };
type BarcodeDraft = { kind: 'barcode'; code: string; height: number; readablePx: number };
type Draft = TextDraft | BarcodeDraft;

/**
 * One text role. A single-line role (price, store, unit) never wraps, so it shrinks by
 * pixels until its own measurement fits the paper — the same rule LabelBuilder applies.
 */
function textDraft(kind: TextDraft['kind'], text: string, px: number, bold: boolean, maxLines: number, printableWidth: number): TextDraft {
  if (maxLines === 1) {
    while (px > 10 && textWidthDots(text, px, bold) > printableWidth) px--;
  }

  return { kind, text, px, bold, maxLines };
}

const QUIET_MODULES = 10;

/**
 * Width in modules of a Code 128 symbol, quiet zones excluded. Digit runs ride Code C (two
 * digits per symbol) and the rest Code B with the cheapest mix of switches, exactly like
 * Code128 on the server, so this plan matches the pixels the printer burns.
 */
export function code128Modules(code: string): number {
  const text = code.replace(/[^\x20-\x7E]/g, '');
  const length = text.length;
  if (length === 0) return 0;

  const isPair = (index: number) => index + 1 < length && /\d/.test(text[index]!) && /\d/.test(text[index + 1]!);
  // Fewest symbols to finish text[i:] while already in Code B (b) or Code C (c).
  const b = new Array<number>(length + 2).fill(0);
  const c = new Array<number>(length + 2).fill(0);
  for (let index = length - 1; index >= 0; index--) {
    const viaChar = 1 + b[index + 1]!;
    const viaPair = isPair(index) ? 1 + c[index + 2]! : Infinity;
    b[index] = Math.min(viaChar, 1 + viaPair);
    c[index] = Math.min(viaPair, 1 + viaChar);
  }

  // Start symbol, the cheapest data run, the checksum; the stop adds 13 modules.
  const data = isPair(0) && c[0]! <= b[0]! ? c[0]! : b[0]!;

  return (1 + data + 1) * 11 + 13;
}

export function layoutLabel(label: LabelPayload, options: LabelLayoutOptions): LabelLayout {
  const widthDots = Math.max(1, Math.round(options.widthMm * PRINT_DOTS_PER_MM));
  const heightDots = Math.max(1, Math.round(options.heightMm * PRINT_DOTS_PER_MM));
  const printableWidth = Math.max(40, widthDots - MARGIN_DOTS * 2);
  const availableHeight = Math.max(1, heightDots - MARGIN_DOTS * 2);

  // The receipt's ladder: wider heads carry a bigger base, small stickers shrink.
  const base = widthDots >= 560 ? 24 : widthDots >= 400 ? 21 : 18;

  const drafts: Draft[] = [];
  if (options.showStoreName && label.storeName) {
    drafts.push(textDraft('storeName', clean(label.storeName), Math.round(base * 0.85), true, 1, printableWidth));
  }
  // The unit rides at the end of the name, "Duvet (per set)", instead of taking a line of its own.
  const title = nameWithUnit(clean(label.name ?? ''), clean(label.unit ?? ''), printableWidth, Math.round(base * 1.1));
  if (title) {
    drafts.push(textDraft('name', title, Math.round(base * 1.1), true, 2, printableWidth));
  }
  if (options.showPrice && label.price) {
    drafts.push(textDraft('price', clean(label.price), Math.round(base * 1.45), true, 1, printableWidth));
  }
  if (options.showSku && label.sku) {
    drafts.push(textDraft('sku', `SKU: ${clean(label.sku)}`, Math.round(base * 0.7), false, 1, printableWidth));
  }

  // Reading order: text first, price right under the name, and the barcode last, where only the
  // scanner needs it and its number sits on a clear bottom edge.
  if (label.barcode) {
    const code = clean(label.barcode);
    let readablePx = options.showBarcodeText ? Math.round(base * 0.8) : 0;
    // The number under the bars shrinks to the paper like any single-line text.
    while (readablePx > 10 && textWidthDots(code, readablePx, false) > printableWidth) readablePx--;
    drafts.push({
      kind: 'barcode',
      code,
      height: Math.max(8, Math.round(options.barcodeHeightDots)),
      readablePx,
    });
  }
  const measure = () => {
    let height = 0;
    let rows = 0;
    for (const draft of drafts) {
      if (draft.kind === 'barcode') {
        height += draft.height + (draft.readablePx > 0 ? lineHeightDots(draft.readablePx) : 0);
        rows += 1;
        continue;
      }
      const lines = wrapText(draft.text, printableWidth, draft.px, draft.bold, draft.maxLines);
      height += Math.max(1, lines.length) * lineHeightDots(draft.px);
      rows += lines.length;
    }

    return height + ROW_GAP_DOTS * Math.max(0, rows - 1);
  };

  // A too-tall sticker shrinks every text role together, like the receipt's
  // shrink-to-fit, so the roles keep their relative weights.
  for (let guard = 0; guard < 24 && measure() > availableHeight; guard++) {
    let changed = false;
    for (const draft of drafts) {
      if (draft.kind !== 'barcode' && draft.px > 10) {
        draft.px = Math.max(10, Math.floor(draft.px * 0.9));
        changed = true;
      }
    }
    if (!changed) break;
  }
  if (measure() > availableHeight) {
    for (const draft of drafts) {
      if (draft.kind === 'barcode') {
        draft.height = Math.max(16, draft.height - (measure() - availableHeight));
        break;
      }
    }
  }

  const rows: LayoutRow[] = [];
  for (const draft of drafts) {
    if (draft.kind === 'barcode') {
      // Code 128 needs 10 empty modules on each side to be read; the widest bar that leaves
      // them inside the printable width is the one that prints.
      const modules = code128Modules(draft.code);
      const narrow = Math.min(6, Math.max(1, Math.floor(printableWidth / (modules + QUIET_MODULES * 2))));
      const readableWidth = draft.readablePx > 0 ? textWidthDots(draft.code, draft.readablePx, false) : 0;
      rows.push({
        type: 'barcode',
        code: draft.code,
        x: 0,
        y: 0,
        width: Math.max(modules * narrow, readableWidth),
        height: draft.height,
        readableHeight: draft.readablePx > 0 ? lineHeightDots(draft.readablePx) : 0,
        readablePx: draft.readablePx,
        narrow,
      });
      continue;
    }
    for (const text of wrapText(draft.text, printableWidth, draft.px, draft.bold, draft.maxLines)) {
      rows.push({
        type: 'text',
        text,
        px: draft.px,
        bold: draft.bold,
        x: 0,
        y: 0,
        width: textWidthDots(text, draft.px, draft.bold),
        height: lineHeightDots(draft.px),
      });
    }
  }

  const rowAdvance = (row: LayoutRow) => (row.type === 'barcode' ? row.height + row.readableHeight : row.height);
  const sumHeight = rows.reduce((total, row) => total + rowAdvance(row), 0);
  let gap = ROW_GAP_DOTS;
  if (rows.length > 1) {
    const slack = availableHeight - sumHeight - ROW_GAP_DOTS * (rows.length - 1);
    if (slack > 0) gap = Math.min(GAP_MAX_DOTS, ROW_GAP_DOTS + Math.floor(slack / (rows.length - 1)));
  }
  const contentHeight = sumHeight + gap * Math.max(0, rows.length - 1);
  let y = MARGIN_DOTS + Math.max(0, Math.floor((availableHeight - contentHeight) / 2));
  for (const row of rows) {
    row.x = Math.max(0, Math.floor((widthDots - row.width) / 2));
    row.y = y;
    y += rowAdvance(row) + gap;
  }

  return { widthDots, heightDots, rows, overflow: contentHeight > availableHeight };
}
