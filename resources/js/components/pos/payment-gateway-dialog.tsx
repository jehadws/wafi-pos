import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { POS_OPTION_KEYS, isPriceWithTax } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Order } from '@/types/models/order';
import { PaymentType } from '@/types/models/payment-type';
import { formatCurrency } from '@/utils/format';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { submitAndFinalizeOrder } from '@/services/order-finalize';
import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { NumberPad } from './number-pad';

interface PaymentGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useBillingAddress: boolean;
  useShippingAddress: boolean;
  resetCart: () => void;
}

/**
 * Compact read-only figure for the summary grid. `highlight` marks the
 * action-driving figure (outstanding due) so the eye lands there first.
 */
function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        highlight ? 'border-primary/30 bg-primary/10' : 'border-border bg-muted/40',
      )}
    >
      <span className="text-muted-foreground block text-xs font-medium">{label}</span>
      <span className="text-foreground mt-1 block text-lg leading-none font-bold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Payment sheet — a single column, no tabs:
 *   summary → amount entry (screen + shortcuts + method chips + keypad)
 *   → always-visible payments list → one contextual primary action.
 *
 * The previous design split "add a payment" and "see payments" into mutually
 * exclusive tabs, which hid every added payment until the user switched tabs.
 */
export function PaymentGatewayDialog({ open, onOpenChange, useShippingAddress, useBillingAddress, resetCart }: PaymentGatewayProps) {
  const {
    order,
    products,
    submitOrder,
    addPayment,
    removePayment,
    options,
    paymentsType,
    selectedPaymentType,
    setPaymentActive,
  } = usePOS();
  const { t } = useTranslation();
  const [screenValue, setScreenValue] = useState('0.00');
  const [rawValue, setRawValue] = useState(0);
  // A payment below the due needs an explicit confirmation before it is
  // recorded; null while no such confirmation is pending.
  const [pendingPartial, setPendingPartial] = useState<{ amount: number } | null>(null);
  const [confirmPartialSubmit, setConfirmPartialSubmit] = useState(false);

  const payments = order.payments || [];
  const paid = payments.reduce((sum: number, p: any) => sum + p.value, 0);
  const total = order.total || 0;
  // Derived from the payment list — order.change is only meaningful after
  // finalization, and the old formula (`tendered > paid`) could never be true
  // since tendered IS the paid sum, so overpayment never showed change.
  const due = Math.max(total - paid, 0);
  const change = Math.max(paid - total, 0);

  // Parse amount shortcuts from options
  const amountShortcuts: number[] = (() => {
    const raw = options[POS_OPTION_KEYS.amountShortcut];
    if (!raw) return [];
    const str = typeof raw === 'string' ? raw : String(raw);
    return str.split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n) && n > 0);
  })();

  // Quick amounts derived from the outstanding balance — exact due first,
  // then round-ups a cashier would hand over in cash. No configuration
  // required; configured shortcuts (amountShortcuts) are merged in.
  const quickAmounts: { value: number; isExact: boolean }[] = (() => {
    if (due <= 0) return [];
    const seen = new Set<number>();
    const list: { value: number; isExact: boolean }[] = [];
    const push = (value: number, isExact = false) => {
      if (!Number.isFinite(value) || value <= 0) return;
      const rounded = Math.round(value * 100) / 100;
      if (seen.has(rounded)) return;
      seen.add(rounded);
      list.push({ value: rounded, isExact });
    };

    // 1. Exact due balance (always first)
    push(due, true);

    // 2. Next whole integer (if due has cents)
    const nextInteger = Math.ceil(due);
    if (nextInteger > due) {
      push(nextInteger);
    }

    // 3. Multiples of 5, 10, 20, 50, 100 based on scale
    const steps = [5, 10, 20, 50, 100, 200, 500, 1000];
    for (const step of steps) {
      const nextMultiple = Math.ceil(due / step) * step;
      if (nextMultiple > due) {
        push(nextMultiple);
      }
      if (list.length >= 5) break;
    }

    // 4. Configured shortcuts
    amountShortcuts.forEach((s) => {
      if (s >= due) push(s);
    });

    return list.slice(0, 5);
  })();

  // The chip flagged active in the store, with fallbacks so the keypad works
  // the moment the sheet opens (types load async; the first is pre-selected).
  const selectedMethod: PaymentType | null =
    paymentsType.find((p) => p.selected) ?? selectedPaymentType ?? paymentsType[0] ?? null;

  const handleNumberInput = (digit: string) => {
    if (!/^\d$/.test(digit)) return;
    const newRaw = rawValue * 10 + parseInt(digit, 10);
    setRawValue(newRaw);
    setScreenValue((newRaw / 100).toFixed(2));
  };

  const handleBackspace = () => {
    const newRaw = Math.floor(rawValue / 10);
    setRawValue(newRaw);
    setScreenValue((newRaw / 100).toFixed(2));
  };

  const handleAmountShortcut = (amount: number) => {
    setRawValue(Math.round(amount * 100));
    setScreenValue(amount.toFixed(2));
  };

  const buildPayment = (method: PaymentType, value: number) => ({
    identifier: method.identifier,
    value,
    label: method.label,
    selected: false,
    readonly: false,
  });

  const resetScreen = () => {
    setScreenValue('0.00');
    setRawValue(0);
  };

  const recordPayment = (amount: number) => {
    if (!selectedMethod) return;
    addPayment(buildPayment(selectedMethod, amount) as any);
    resetScreen();
  };

  const handleConfirmPayment = () => {
    const amount = Number.parseFloat(screenValue);
    if (!selectedMethod || isNaN(amount) || amount <= 0) return;
    // Ambiguous case: a payment below the due leaves part of the order
    // unpaid — ask before recording it. Full and overpayments stay
    // friction-free.
    if (amount < due) {
      setPendingPartial({ amount });
      return;
    }
    recordPayment(amount);
  };

  const handleConfirmPartialPayment = () => {
    if (!pendingPartial) return;
    recordPayment(pendingPartial.amount);
    setPendingPartial(null);
  };

  const handleSubmitOrder = async (paymentStatus: string = 'paid') => {
    const orderData = {
      ...order,
      payment_status: paymentStatus,
      customer: {
        ...order.customer,
        selected: true,
      },
      addresses: {
        billing: useBillingAddress ? order.customer?.billing : order.addresses?.billing,
        shipping: useShippingAddress ? order.customer?.shipping : order.addresses?.shipping,
      },
    };

    await submitAndFinalizeOrder({
      order,
      orderData: orderData as Order,
      products,
      submitOrder,
      printOrderReceipt: (receiptOrder) => usePOS.getState().printOrderReceipt(receiptOrder),
      priceWithTax: isPriceWithTax(options),
      resetCart,
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleSaveAsUnpaid = async () => {
    await handleSubmitOrder('unpaid');
  };

  // Submit finalizes the sale. When a balance would remain unpaid, that is
  // the one-way door — confirm it explicitly. Fully covered sales submit
  // straight away.
  const handleSubmitPayment = async () => {
    if (due > 0) {
      setConfirmPartialSubmit(true);
      return;
    }
    await handleSubmitOrder('paid');
  };

  const confirmPartialSubmitAction = async () => {
    setConfirmPartialSubmit(false);
    await handleSubmitOrder('partially_paid');
  };

  const unpaidAllowed = options[POS_OPTION_KEYS.allowUnpaid] !== 'no';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'bg-card flex h-full flex-col gap-0 overflow-hidden p-0',
          'rounded-ss-2xl rounded-es-2xl shadow-2xl border-s border-border/80',
          'w-full sm:w-[85%] sm:max-w-none lg:w-[42%] lg:min-w-[420px]',
        )}
      >
        <SheetTitle className="sr-only">{t('Payment Gateway')}</SheetTitle>
        <SheetDescription className="sr-only">{t('Payment Gateway')}</SheetDescription>

        {/* Header — clean title; the outstanding remainder lives in the footer,
            pinned next to the action it explains. */}
        <div className="border-border flex shrink-0 items-center justify-between border-b p-4 pe-14">
          <h2 className="text-foreground text-lg font-semibold">{t('Payment Gateway')}</h2>
        </div>

        <ScrollArea className="min-h-0 flex-1 overscroll-contain">
          <div className="flex flex-col gap-4 p-4 lg:p-5">
            {/* Summary — the whole payment state at a glance */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label={t('Total')} value={formatCurrency(total)} />
              <StatCard label={t('Paid')} value={formatCurrency(paid)} />
              <StatCard label={t('Due')} value={formatCurrency(due)} highlight={due > 0} />
              <StatCard label={t('Change')} value={formatCurrency(change)} />
            </div>

            {/* Entered amount */}
            <div className="border-border bg-muted/40 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">{t('Amount')} :</span>
                <span className="text-foreground text-3xl font-bold tabular-nums">
                  {formatCurrency(Number.parseFloat(screenValue) || 0)}
                </span>
              </div>
            </div>

            {quickAmounts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase">
                  {t('Quick Amounts')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map(({ value, isExact }) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'bg-card min-h-11 rounded-full font-semibold shadow-2xs active:scale-95 transition-all',
                        isExact
                          ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary'
                          : 'border-border text-foreground hover:border-primary/40 hover:bg-muted/60',
                      )}
                      onClick={() => handleAmountShortcut(value)}
                    >
                      {isExact && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary me-1">
                          {t('Exact')}
                        </span>
                      )}
                      <span>{formatCurrency(value)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Method chips — the typed amount is added under this method */}
            <div className="space-y-2">
              <span className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase">
                {t('Payment Method')}
              </span>
              <div className="flex flex-wrap gap-2">
                {paymentsType.map((method: PaymentType) => {
                  const active = selectedMethod?.identifier === method.identifier;
                  return (
                    <button
                      key={method.identifier}
                      type="button"
                      onClick={() => setPaymentActive(method)}
                      className={cn(
                        'active:scale-95 inline-flex min-h-[48px] h-12 items-center justify-center rounded-xl border px-5 py-2 text-sm font-semibold transition-all',
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-muted/60',
                      )}
                    >
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <NumberPad
              onNumberClick={handleNumberInput}
              onBackspace={handleBackspace}
              onConfirm={handleConfirmPayment}
            />

            {/* Added payments — always visible, no tab switching */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {t('Payments')}
                  <span className="bg-primary/10 text-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums">
                    {payments.length}
                  </span>
                </span>
                {payments.length > 0 && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t('Paid')}: {formatCurrency(paid)}
                  </span>
                )}
              </div>

              {payments.length === 0 ? (
                <div className="text-muted-foreground border-border rounded-lg border border-dashed p-4 text-center text-xs">
                  {t('Nothing to display...')}
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment: any, index: number) => {
                    // Payments attached to a saved order row cannot be deleted
                    // (the store rejects them) — surface that in the UI too.
                    const attached = payment.id !== undefined;
                    return (
                      <div
                        key={payment.id ?? `${payment.identifier}-${payment.value}-${index}`}
                        className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border px-3 py-2"
                      >
                        <span className="text-foreground min-w-0 flex-1 truncate text-sm">{payment.label}</span>
                        <span className="text-foreground text-sm font-bold tabular-nums">{formatCurrency(payment.value)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive active:scale-95 h-8 w-8 shrink-0"
                          disabled={attached}
                          title={attached ? t('Unable to delete a payment attached to the order.') : undefined}
                          aria-label={`${t('Remove')} ${payment.label}`}
                          onClick={() => removePayment(payment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer — always shows the primary action so the cashier is never
            left with an empty bar. Policy limits (allowPartial/allowUnpaid)
            are enforced by the submission pipeline with a descriptive toast
            instead of silently hiding the button. */}
        <div className="border-border bg-card/95 backdrop-blur-xs flex shrink-0 items-center justify-end gap-3 border-t p-4">
          {due > 0 && (
            <span className="text-muted-foreground me-auto text-sm tabular-nums">
              {t('Remaining')}: <span className="text-foreground font-semibold">{formatCurrency(due)}</span>
            </span>
          )}

          {paid === 0 && unpaidAllowed && (
            <Button
              variant="outline"
              onClick={handleSaveAsUnpaid}
              className="h-12 px-6 text-sm font-semibold"
            >
              {t('Unpaid')}
            </Button>
          )}

          <Button
            onClick={handleSubmitPayment}
            disabled={paid === 0 && total > 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 min-w-40 px-6 text-sm font-semibold"
          >
            {t('Submit Payment')}
          </Button>
        </div>

        {/* Partial-payment guards — record and finalize both get an explicit
            confirmation; full/over payments never see these. */}
        <ConfirmationDialog
          isOpen={pendingPartial !== null}
          onClose={() => setPendingPartial(null)}
          onConfirm={handleConfirmPartialPayment}
          variant="warning"
          title={t('Confirm Partial Payment')}
          description={
            selectedMethod && pendingPartial
              ? `${selectedMethod.label}: ${formatCurrency(pendingPartial.amount)} · ${t('Remaining')}: ${formatCurrency(Math.max(due - pendingPartial.amount, 0))}`
              : ''
          }
          confirmText={t('Confirm')}
          cancelText={t('Cancel')}
        />

        <ConfirmationDialog
          isOpen={confirmPartialSubmit}
          onClose={() => setConfirmPartialSubmit(false)}
          onConfirm={confirmPartialSubmitAction}
          variant="warning"
          title={t('Submit Partial Payment')}
          description={`${t('Remaining')}: ${formatCurrency(due)}`}
          confirmText={t('Continue')}
          cancelText={t('Cancel')}
        />
      </SheetContent>
    </Sheet>
  );
}
