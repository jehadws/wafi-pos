/**
 * services/order-finalize.ts
 *
 * Post-submission order finalization pipeline: success feedback, receipt
 * printing (with retry affordance), cash-drawer kick, and cart reset.
 *
 * Extracted from the payment gateway dialog so that any checkout path
 * (dialog-based or a future direct/fast path) shares one behaviorally
 * identical finalization pipeline.
 */

import { i18n } from '@/lib/i18n';
import PrintAgentService, { type PrintResult } from '@/services/print-agent-service';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';
import { toast } from 'sonner';

/** Same translate singleton the useTranslation hook wraps — usable outside React. */
const t = (key: string, params?: Record<string, any>) => i18n.translate(key, params);

export interface SubmitAndFinalizeOrderParams {
  /** Live cart state — used to enrich the receipt. */
  order: Order;
  /** The exact payload handed to submitOrder (payment_status, addresses, customer…). */
  orderData: Order;
  /** Cart line items — the receipt's source of truth for products. */
  products: OrderProduct[];
  /** Store submitOrder action (register stamping & validation live there). */
  submitOrder: (orderFields: object) => Promise<any>;
  /** Store printOrderReceipt action (printingEnabledFor / printingDocument gating). */
  printOrderReceipt: (order: Order, mode?: string) => Promise<PrintResult | false>;
  /**
   * Mirrors the "Show Price With Tax" POS option for the direct-service
   * retry path (the primary print path resolves it from the store).
   * Defaults to true (historical behavior) when not supplied.
   */
  priceWithTax?: boolean;
  /** Clears the cart after a successful finalize. */
  resetCart: () => void;
  /** Invoked after a successful finalize (e.g. close the payment dialog). */
  onSuccess?: () => void;
}

/**
 * Receipt source of truth: the local cart state (items, payments, totals,
 * customer) enriched with the server-assigned identity.
 */
export function buildReceiptOrder(order: Order, orderData: Order, products: OrderProduct[], createdOrder: any): Order {
  const savedOrder = (createdOrder?.data?.order ?? {}) as Record<string, unknown>;
  const orderRecord = order as unknown as Record<string, unknown>;
  const total = order.total || 0;
  const paid = (order.payments ?? []).reduce((sum: number, p: any) => sum + p.value, 0);

  return {
    ...order,
    ...orderData,
    products: products,
    change: order.tendered > paid ? order.tendered - total : 0,
    id: savedOrder.id ?? orderRecord.id,
    code: savedOrder.code ?? orderRecord.code,
    payment_status: orderData.payment_status,
  } as unknown as Order;
}

/**
 * Submits the order and runs the canonical finalization pipeline:
 * submit → toast → auto-print (option-gated, with retry on failure) →
 * cash-drawer kick → cart reset → onSuccess.
 *
 * Mirrors the historical payment-gateway-dialog behavior 1:1:
 * - paid / partially_paid orders attempt an auto-print.
 * - When printing is disabled by policy, cash sales still pulse the drawer.
 * - When a print fails, the error toast carries a Retry action and the
 *   drawer is pulsed directly (the receipt carries its own kick on success).
 * - Any submission error aborts finalization (no reset, no onSuccess).
 */
export async function submitAndFinalizeOrder({
  order,
  orderData,
  products,
  submitOrder,
  printOrderReceipt,
  priceWithTax = true,
  resetCart,
  onSuccess,
}: SubmitAndFinalizeOrderParams): Promise<void> {
  try {
    const createdOrder = await submitOrder(orderData);
    toast.success(t('The operation was successful.'));

    const paymentStatus = orderData.payment_status;
    const receiptOrder = buildReceiptOrder(order, orderData, products, createdOrder);

    const hasCashPayment = (orderData.payments ?? []).some((p: any) => p.identifier === 'cash-payment');

    const printerSettings = PrintAgentService.getSettings();

    /**
     * Canonical auto-print path — honours the printingEnabledFor /
     * printingDocument POS options and reuses the Order → receipt mapping
     * from PrintAgentService. A successful receipt print carries its own
     * cash-drawer kick (ESC p) when "Open Cash Drawer" is enabled.
     */
    let printResult: PrintResult | false = false;
    if (paymentStatus === 'paid' || paymentStatus === 'partially_paid') {
      printResult = await printOrderReceipt(receiptOrder);
    }

    if (printResult === false) {
      // Printing disabled by policy — still pulse the drawer for cash sales.
      if (printerSettings.openCashDrawer && hasCashPayment) {
        await PrintAgentService.openCashDrawer();
      }
    } else if (!printResult.success) {
      toast.error(
        t('Order #{code} saved, but receipt failed to print: {error}', {
          code: String(receiptOrder.code ?? ''),
          error: printResult.error || t('Printer unavailable'),
        }),
        {
          duration: 8000,
          action: {
            label: t('Retry Print'),
            onClick: () => {
              PrintAgentService.printOrderReceipt(receiptOrder, 'sale', {}, priceWithTax).then((retryRes) => {
                if (retryRes.success) {
                  toast.success(t('Receipt printed successfully.'));
                } else {
                  toast.error(retryRes.error || t('Print retry failed.'));
                }
              });
            },
          },
        },
      );

      // The receipt (which carries the drawer kick) failed — pulse the drawer directly.
      if (printerSettings.openCashDrawer && hasCashPayment) {
        PrintAgentService.openCashDrawer();
      }
    }

    resetCart();
    onSuccess?.();
  } catch (error: any) {
    toast.error(error?.message || t('An unexpected error occurred'));
  }
}
