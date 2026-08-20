import { PaymentType } from '@/interfaces/payment-type';

export type PaymentTypes = 'cash-payment' | 'bank-payment' | 'customer-payment';

/** Single source of truth for built-in POS payment method labels */
export const PAYMENT_METHOD_LABELS: Record<PaymentTypes, string> = {
    'cash-payment': 'Cash Payment',
    'bank-payment': 'Bank Payment',
    'customer-payment': 'Customer Payment',
};

export function buildDefaultPaymentTypes(): PaymentType[] {
    return (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentTypes, string][]).map(
        ([identifier, label]) => ({
            identifier,
            label,
            selected: identifier === 'cash-payment',
        }),
    );
}

export function getPaymentMethodLabel(identifier: string): string {
    return PAYMENT_METHOD_LABELS[identifier as PaymentTypes] ?? identifier;
}
