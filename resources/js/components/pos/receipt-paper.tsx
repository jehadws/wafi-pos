'use client';

import QRCode from '@/components/common/qr-code';
import { BarcodeStrip } from '@/components/pos/barcode-strip';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { FormattedReceiptData, PrinterSettings } from '@/services/printing-service';
import { formatCurrency } from '@/utils/format';
import { Scissors } from 'lucide-react';

/**
 * On-screen receipt that mirrors ReceiptBuilder's line model: the same paper
 * width in characters, the same column proportions and the same section order,
 * so what the cashier reads here is what the printer emits.
 */

const PAPER_FONT_SIZE = 12;
const QTY_CHARS = 6;
const TOTAL_CHARS = 14;

export interface ReceiptPaperProps {
  data: FormattedReceiptData;
  settings: PrinterSettings;
  className?: string;
}

/**
 * The receipt payload carries plain numbers and the backend formats them with the
 * store's `sb_currency_*` options; this applies the same options to the preview so
 * the two agree. Text an older caller already formatted is printed as it arrived.
 */
function money(value: number | string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? formatCurrency(parsed) : value;
  }

  return formatCurrency(value);
}

/** The printer pads a two-column line out to the paper width. */
function Rule({ width, char }: { width: number; char: '-' | '=' }) {
  const text = char === '-' ? '- '.repeat(Math.floor(width / 2)).padEnd(width, '-') : char.repeat(width);

  return (
    <div className="truncate text-neutral-400" aria-hidden>
      {text}
    </div>
  );
}

function Pair({ label, value, className }: { label?: string; value?: string; className?: string }) {
  if (value === undefined || value === '') return null;

  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <span className="min-w-0 truncate opacity-80" dir="auto">
        {label}
      </span>
      <span className="shrink-0 tabular-nums" dir="ltr">
        {value}
      </span>
    </div>
  );
}

export function ReceiptPaper({ data, settings, className }: ReceiptPaperProps) {
  const { t } = useTranslation();
  const chars = Math.min(64, Math.max(24, settings.lineWidth || 42));
  const nameChars = Math.max(10, chars - QTY_CHARS - TOTAL_CHARS);
  const columns = `${nameChars}ch ${QTY_CHARS}ch ${TOTAL_CHARS}ch`;
  const showTaxLines = settings.showTaxBreakdown && (data.taxes?.length ?? 0) > 0;

  return (
    <div className={cn('mx-auto w-fit shrink-0', className)}>
      <svg className="block h-2 w-full text-white" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden>
        <path d={`M0 8 ${Array.from({ length: 20 }, (_, i) => `L${i * 5 + 2.5} 0 L${(i + 1) * 5} 8`).join(' ')} Z`} fill="currentColor" />
      </svg>

      <div
        data-paper
        className="bg-white px-4 pb-4 text-neutral-900 shadow-lg ring-1 ring-black/5"
        style={{
          width: `calc(${chars}ch + 2rem)`,
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: `${PAPER_FONT_SIZE}px`,
          lineHeight: 1.45,
        }}
      >
        {/* Store header — printed double-size and centred. */}
        <div className="flex flex-col items-center gap-0.5 text-center">
          {data.storeLogo && (
            <img src={data.storeLogo} alt="" className="mb-1 max-h-14 max-w-[60%] object-contain" onError={(e) => (e.currentTarget.hidden = true)} />
          )}
          <div className="text-[20px] leading-tight font-bold break-words uppercase" dir="auto">
            {data.storeName || 'Subul POS'}
          </div>
          {data.storeAddress && <div dir="auto">{data.storeAddress}</div>}
          {data.storeCity && <div dir="auto">{data.storeCity}</div>}
          {data.storePobox && (
            <div dir="auto">
              {t('P.O.Box')}: {data.storePobox}
            </div>
          )}
          {data.storePhone && (
            <div dir="auto">
              {t('Tel')}: {data.storePhone}
            </div>
          )}
          {data.storeEmail && <div dir="auto">{data.storeEmail}</div>}
        </div>

        <div className="my-2 space-y-0.5">
          <Rule width={chars} char="-" />
          <Pair label={t('Order')} value={data.orderCode} />
          <Pair label={t('Date')} value={data.date} />
          <Pair label={t('Cashier')} value={data.cashier} />
          <Pair label={t('Customer')} value={data.customer} />
          <Pair label={t('Type')} value={data.orderType?.toUpperCase()} />
          <Rule width={chars} char="-" />
        </div>

        {/* Items */}
        <div className="space-y-0.5">
          <div className="grid font-bold" style={{ gridTemplateColumns: columns }}>
            <span dir="auto">{t('Item')}</span>
            <span className="text-end" dir="auto">
              {t('Qty')}
            </span>
            <span className="text-end" dir="auto">
              {t('Total')}
            </span>
          </div>
          <div className="truncate text-neutral-400" aria-hidden>
            {'-'.repeat(chars)}
          </div>

          {data.items?.map((item, index) => (
            <div key={index} className="space-y-0.5">
              <div className="grid items-start" style={{ gridTemplateColumns: columns }}>
                <span className="min-w-0 pe-1 font-medium break-words" dir="auto">
                  {item.name}
                </span>
                <span className="text-end tabular-nums">{item.quantity}x</span>
                <span className="text-end font-bold tabular-nums">{money(item.total)}</span>
              </div>
              {item.price !== undefined && item.price !== '' && <div className="text-[10px] opacity-70">@ {money(item.price)}</div>}
            </div>
          ))}

          <Rule width={chars} char="-" />
        </div>

        {/* Summary */}
        <div className="space-y-0.5">
          {data.subtotal !== undefined && <Pair label={t('Subtotal')} value={money(data.subtotal)} />}
          {data.discount !== undefined && Number(data.discount) > 0 && <Pair label={t('Discount')} value={`-${money(data.discount)}`} />}
          {showTaxLines
            ? data.taxes?.map((tax, index) => <Pair key={index} className="ps-3" label={`${tax.name} (${tax.rate}%)`} value={money(tax.tax_value)} />)
            : data.tax !== undefined && Number(data.tax) > 0 && <Pair label={t('Tax')} value={money(data.tax)} />}
        </div>

        {/* Total: the printer rules it with '=' and doubles the height. */}
        <div className="my-1">
          <Rule width={chars} char="=" />
          <div className="flex items-baseline justify-between gap-3 py-0.5 text-[15px] font-bold">
            <span dir="auto">{t('Total')}</span>
            <span className="tabular-nums">{money(data.total)}</span>
          </div>
          <Rule width={chars} char="=" />
        </div>

        <div className="space-y-0.5">
          {data.payments?.map((payment, index) => (
            <Pair key={index} label={payment.name} value={money(payment.value)} />
          ))}
          {data.tendered !== undefined && <Pair label={t('Tendered')} value={money(data.tendered)} />}
          {data.change !== undefined && <Pair label={t('Change')} value={money(data.change)} />}
          <Pair label={t('Method')} value={data.paymentMethod} />
        </div>

        <div className="my-2 space-y-1">
          <Rule width={chars} char="-" />
          {data.barcode ? (
            <BarcodeStrip value={data.barcode} />
          ) : data.qrCode ? (
            <div className="flex justify-center py-1">
              <QRCode value={data.qrCode} size={96} bgColor="#FFFFFF" fgColor="#111111" />
            </div>
          ) : null}
        </div>

        <div className="space-y-0.5 text-center">
          <div className="font-semibold" dir="auto">
            {data.footer || t('Thank you for your business!')}
          </div>
          <div className="text-[10px] opacity-60">{t('Powered by Subul')}</div>
        </div>

        {settings.cutPaper ? (
          <div className="mt-3 flex items-center gap-2 text-neutral-400">
            <Scissors className="h-3.5 w-3.5 shrink-0" />
            <div className="flex-1 border-t border-dashed border-neutral-400" />
            <span className="text-[10px] uppercase">{t('Cut')}</span>
          </div>
        ) : (
          <div className="mt-3 text-center text-[10px] text-neutral-400 uppercase">{t('No cut — feeds 3 lines')}</div>
        )}
      </div>
    </div>
  );
}
