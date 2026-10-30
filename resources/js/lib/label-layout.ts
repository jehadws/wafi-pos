/** 203 DPI thermal heads: label geometry is expressed in print dots. */
export const PRINT_DOTS_PER_MM = 8;

// Mirrors LabelBuilder::layout() in app/Services/Printing/LabelBuilder.php: keep both in sync so the
// preview shows the geometry the label printer actually receives.
const FONT_WIDTH_DOTS = { 1: 8, 2: 12, 3: 16 } as const;
const FONT_HEIGHT_DOTS = { 1: 16, 2: 24, 3: 32 } as const;
const ROW_GAP_DOTS = 8;
const GAP_MAX_DOTS = 24;
const MARGIN_DOTS = 8;

type TsplFont = keyof typeof FONT_WIDTH_DOTS;

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
  | { type: 'text'; font: TsplFont; scale: number; text: string; x: number; y: number; width: number; height: number }
  | {
      type: 'barcode';
      code: string;
      x: number;
      y: number;
      width: number;
      height: number;
      readableHeight: number;
      readable: boolean;
    };

export interface LabelLayout {
  widthDots: number;
  heightDots: number;
  scale: number;
  rows: LayoutRow[];
  overflow: boolean;
}

export interface LabelPayload {
  storeName?: string;
  name?: string;
  price?: string;
  barcode?: string;
  sku?: string;
}

/** Only these fields reach the paper, so only these identify a rendered label. */
export function labelPrintableKey(item: LabelPayload): string {
  return JSON.stringify([item.storeName ?? '', item.name ?? '', item.price ?? '', item.barcode ?? '', item.sku ?? '']);
}

export function hashKey(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  }

  return (hash >>> 0).toString(36);
}
function code128Modules(code: string) {
  const symbolCount = /^\d+$/.test(code) ? Math.ceil(code.length / 2) + 2 : code.length + 2;
  return symbolCount * 11 + 13;
}

/** Largest x-multiplication where the text still fits one line, capped per element role. */
function fitScale(font: TsplFont, text: string, printableWidth: number, cap: number) {
  const byWidth = Math.floor(printableWidth / (Math.max(1, text.length) * FONT_WIDTH_DOTS[font]));
  return Math.min(cap, Math.max(1, byWidth));
}

/** Greedy word wrap into at most two lines; words longer than a line are hard-split. */
function wrapLabelLines(text: string, maxCharsPerLine: number): string[] {
  if (!text || maxCharsPerLine <= 0) return [];
  if (text.length <= maxCharsPerLine) return [text];
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (line && line.length + 1 + word.length <= maxCharsPerLine) {
      line = `${line} ${word}`;
      continue;
    }
    if (line) {
      lines.push(line);
      if (lines.length === 2) return lines;
    }
    line = word;
    while (line.length > maxCharsPerLine) {
      lines.push(line.slice(0, maxCharsPerLine));
      line = line.slice(maxCharsPerLine);
      if (lines.length === 2) return lines;
    }
  }
  if (line && lines.length < 2) lines.push(line);
  return lines.slice(0, 2);
}

type TextDraft = { kind: 'storeName' | 'name' | 'price' | 'sku'; font: TsplFont; text: string; scale: number };
type BarcodeDraft = { kind: 'barcode'; code: string; height: number; readableHeight: number };
type Draft = TextDraft | BarcodeDraft;

export function layoutTsplLabel(label: LabelPayload, options: LabelLayoutOptions): LabelLayout {
  const widthDots = Math.max(1, Math.round(options.widthMm * PRINT_DOTS_PER_MM));
  const heightDots = Math.max(1, Math.round(options.heightMm * PRINT_DOTS_PER_MM));
  const printableWidth = widthDots - MARGIN_DOTS * 2;
  const availableHeight = heightDots - MARGIN_DOTS * 2;

  const drafts: Draft[] = [];
  if (options.showStoreName && label.storeName) {
    drafts.push({ kind: 'storeName', font: 1, text: label.storeName, scale: fitScale(1, label.storeName, printableWidth, 2) });
  }
  let nameDraft: TextDraft | null = null;
  if (label.name) {
    let scale = 1;
    for (const candidate of [3, 2, 1] as const) {
      if (label.name.length <= Math.floor(printableWidth / (FONT_WIDTH_DOTS[2] * candidate)) * 2) {
        scale = candidate;
        break;
      }
    }
    nameDraft = { kind: 'name', font: 2, text: label.name, scale };
    drafts.push(nameDraft);
  }
  let barcodeDraft: BarcodeDraft | null = null;
  if (label.barcode) {
    const readable = options.showBarcodeText;
    barcodeDraft = {
      kind: 'barcode',
      code: label.barcode,
      height: Math.max(8, Math.round(options.barcodeHeightDots)),
      readableHeight: readable ? FONT_HEIGHT_DOTS[2] : 0,
    };
    drafts.push(barcodeDraft);
  }
  if (options.showPrice && label.price) {
    drafts.push({ kind: 'price', font: 3, text: label.price, scale: fitScale(3, label.price, printableWidth, 2) });
  }
  if (options.showSku && label.sku) {
    drafts.push({ kind: 'sku', font: 1, text: `SKU: ${label.sku}`, scale: 1 });
  }

  const nameDraftRef = nameDraft;
  const nameLinesAt = (scale: number) =>
    nameDraftRef ? wrapLabelLines(nameDraftRef.text, Math.floor(printableWidth / (FONT_WIDTH_DOTS[2] * scale))) : [];
  const rowCount = () => (nameDraftRef ? drafts.length - 1 + nameLinesAt(nameDraftRef.scale).length : drafts.length);
  const blockHeight = () =>
    drafts.reduce(
      (total, draft) => {
        if (draft.kind === 'barcode') return total + draft.height + draft.readableHeight;
        if (draft.kind === 'name') return total + nameLinesAt(draft.scale).length * FONT_HEIGHT_DOTS[2] * draft.scale;
        return total + FONT_HEIGHT_DOTS[draft.font] * draft.scale;
      },
      ROW_GAP_DOTS * Math.max(0, rowCount() - 1),
    );

  const degrade = () => {
    const store = drafts.find((draft): draft is TextDraft => draft.kind === 'storeName');
    if (store && store.scale > 1) {
      store.scale = 1;
      return true;
    }
    if (nameDraftRef && nameDraftRef.scale > 1) {
      nameDraftRef.scale -= 1;
      return true;
    }
    const price = drafts.find((draft): draft is TextDraft => draft.kind === 'price');
    if (price && price.scale > 1) {
      price.scale = 1;
      return true;
    }
    return false;
  };

  while (blockHeight() > availableHeight && degrade()) {
    // Step down the largest decorative scaling first.
  }
  if (barcodeDraft && blockHeight() > availableHeight) {
    // Last resort on a short sticker: shrink the bars rather than drop content.
    barcodeDraft.height = Math.max(32, barcodeDraft.height - (blockHeight() - availableHeight));
    if (blockHeight() > availableHeight) {
      barcodeDraft.height = Math.max(16, barcodeDraft.height - (blockHeight() - availableHeight));
    }
  }
  const overflow = blockHeight() > availableHeight;

  const rows: LayoutRow[] = [];
  for (const draft of drafts) {
    if (draft.kind === 'barcode') {
      const narrow = Math.min(6, Math.max(1, Math.floor((printableWidth * 0.9) / code128Modules(draft.code))));
      rows.push({
        type: 'barcode',
        code: draft.code,
        x: 0,
        y: 0,
        width: code128Modules(draft.code) * narrow,
        height: draft.height,
        readableHeight: draft.readableHeight,
        readable: draft.readableHeight > 0,
      });
    } else if (draft.kind === 'name') {
      for (const lineText of nameLinesAt(draft.scale)) {
        rows.push({ type: 'text', font: draft.font, scale: draft.scale, text: lineText, x: 0, y: 0, width: 0, height: 0 });
      }
    } else {
      const maxChars = Math.floor(printableWidth / (FONT_WIDTH_DOTS[draft.font] * draft.scale));
      const text = draft.text.substring(0, maxChars);
      rows.push({ type: 'text', font: draft.font, scale: draft.scale, text, x: 0, y: 0, width: 0, height: 0 });
    }
  }

  const rowAdvance = (row: LayoutRow) => (row.type === 'barcode' ? row.height + row.readableHeight : row.height);
  for (const row of rows) {
    if (row.type !== 'barcode') {
      row.width = row.text.length * FONT_WIDTH_DOTS[row.font] * row.scale;
      row.height = FONT_HEIGHT_DOTS[row.font] * row.scale;
    }
  }
  const sumHeight = rows.reduce((total, row) => total + rowAdvance(row), 0);
  let gap = ROW_GAP_DOTS;
  if (rows.length > 1) {
    const slack = availableHeight - sumHeight - ROW_GAP_DOTS * (rows.length - 1);
    if (slack > 0) gap = Math.min(ROW_GAP_DOTS + Math.floor(slack / (rows.length - 1)), GAP_MAX_DOTS);
  }
  let y = MARGIN_DOTS + Math.max(0, Math.floor((availableHeight - (sumHeight + gap * Math.max(0, rows.length - 1))) / 2));
  for (const row of rows) {
    row.x = Math.max(0, Math.floor((widthDots - row.width) / 2));
    row.y = y;
    y += rowAdvance(row) + gap;
  }

  return { widthDots, heightDots, scale: nameDraft ? nameDraft.scale : 1, rows, overflow };
}
