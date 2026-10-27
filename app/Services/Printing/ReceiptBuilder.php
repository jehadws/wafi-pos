<?php

namespace App\Services\Printing;

class ReceiptBuilder
{
    public function __construct(private readonly ArabicTextFormatter $formatter)
    {
    }

    public function build(array $receipt, array $config = []): string
    {
        $lineWidth = (int) ($config['lineWidth'] ?? 42);
        $builder = new EscPosBuilder(
            $this->formatter,
            $lineWidth,
            (string) ($config['encoding'] ?? $config['codePage'] ?? 'cp864'),
            (int) ($config['rasterWidth'] ?? ($lineWidth <= 36 ? 384 : 560)),
        );
        $builder->init();
        if (array_key_exists('lineSpacing', $config)) {
            $builder->lineSpacing($config['lineSpacing'] === null ? null : (int) $config['lineSpacing']);
        }

        $builder->align('center')->bold()->textSize(2, 2)->line((string) ($receipt['storeName'] ?? 'Subul'), 34)->resetFormat()->align('center');
        $this->optionalLine($builder, $receipt, 'storeAddress');
        $this->optionalLine($builder, $receipt, 'storeCity');
        if (! empty($receipt['storePobox'])) {
            $builder->line('P.O.Box: '.$receipt['storePobox']);
        }
        if (! empty($receipt['storePhone'])) {
            $builder->line('Tel: '.$receipt['storePhone']);
        }
        $this->optionalLine($builder, $receipt, 'storeEmail');
        $builder->dashedDivider()->align('left');

        $this->optionalPair($builder, 'Order:', $receipt['orderCode'] ?? null);
        $this->optionalPair($builder, 'Date:', $receipt['date'] ?? null);
        $this->optionalPair($builder, 'Cashier:', $receipt['cashier'] ?? null);
        $this->optionalPair($builder, 'Customer:', $receipt['customer'] ?? null);
        $this->optionalPair($builder, 'Type:', isset($receipt['orderType']) ? strtoupper((string) $receipt['orderType']) : null);
        $builder->dashedDivider();

        [$nameWidth, $quantityWidth, $totalWidth] = $builder->productColumns();
        $builder->bold()->line(
            str_pad('ITEM', $nameWidth)
            .str_pad('QTY', $quantityWidth, ' ', STR_PAD_LEFT)
            .str_pad('TOTAL', $totalWidth, ' ', STR_PAD_LEFT),
        )->resetFormat()->divider();

        foreach ($receipt['items'] ?? [] as $item) {
            $builder->productRow(
                (string) ($item['name'] ?? 'Item'),
                ((string) ($item['quantity'] ?? 1)).'x',
                array_key_exists('price', $item) ? (string) $item['price'] : null,
                (string) ($item['total'] ?? ''),
            );
        }

        $builder->dashedDivider();
        if (array_key_exists('subtotal', $receipt)) {
            $builder->twoColumns('Subtotal', (string) $receipt['subtotal']);
        }
        if ($this->amount($receipt['discount'] ?? null) > 0) {
            $builder->twoColumns('Discount', '-'.$receipt['discount']);
        }
        if (($config['showTaxBreakdown'] ?? false) && ! empty($receipt['taxes'])) {
            foreach ($receipt['taxes'] as $tax) {
                $builder->twoColumns(
                    sprintf('  %s (%s%%)', $tax['name'] ?? 'Tax', $tax['rate'] ?? 0),
                    (string) ($tax['tax_value'] ?? ''),
                );
            }
        } elseif ($this->amount($receipt['tax'] ?? null) > 0) {
            $builder->twoColumns('Tax', (string) $receipt['tax']);
        }

        $builder->divider('=')->bold()->textSize(1, 2)->twoColumns('TOTAL', (string) ($receipt['total'] ?? '0.00'))->resetFormat()->divider();
        if (! empty($receipt['payments'])) {
            foreach ($receipt['payments'] as $payment) {
                $builder->twoColumns((string) ($payment['name'] ?? 'Paid'), (string) ($payment['value'] ?? $payment['amount'] ?? ''));
            }
        } elseif (array_key_exists('tendered', $receipt)) {
            $builder->twoColumns('Tendered', (string) $receipt['tendered']);
        }
        $this->optionalPair($builder, 'Change', $receipt['change'] ?? null);
        $this->optionalPair($builder, 'Method', $receipt['paymentMethod'] ?? null);
        $builder->dashedDivider();

        if (! empty($receipt['barcode'])) {
            $builder->barcode128((string) $receipt['barcode'], 50);
        } elseif (! empty($receipt['qrCode'])) {
            $builder->qrCode((string) $receipt['qrCode']);
        }

        $builder->align('center')->line((string) ($receipt['footer'] ?? 'Thank you for your business!'))->line('Powered by Subul');
        if ($config['openCashDrawer'] ?? false) {
            $builder->drawer();
        }
        if ($config['cutPaper'] ?? true) {
            $builder->cut();
        } else {
            $builder->feed(3);
        }

        return $builder->toString();
    }

    public function drawer(int $pin = 0): string
    {
        return (new EscPosBuilder($this->formatter))->init()->drawer($pin)->toString();
    }

    private function optionalLine(EscPosBuilder $builder, array $receipt, string $key): void
    {
        if (! empty($receipt[$key])) {
            $builder->line((string) $receipt[$key]);
        }
    }

    private function optionalPair(EscPosBuilder $builder, string $label, mixed $value): void
    {
        if ($value !== null && $value !== '') {
            $builder->twoColumns($label, (string) $value);
        }
    }

    /**
     * Amounts arrive formatted for the currency ("$5.00", "1.234,56"), and
     * casting that text to a float reads zero, which would drop the line from
     * the receipt. Read the number out of the text instead.
     */
    private function amount(mixed $value): float
    {
        $digits = preg_replace('/[^\d.,-]/u', '', (string) $value) ?? '';

        if (! preg_match('/\d/', $digits)) {
            return 0.0;
        }

        if (str_contains($digits, ',') && str_contains($digits, '.')) {
            $digits = strrpos($digits, '.') > strrpos($digits, ',')
                ? str_replace(',', '', $digits)
                : str_replace(['.', ','], ['', '.'], $digits);
        } elseif (str_contains($digits, ',')) {
            $digits = str_replace(',', '.', $digits);
        }

        return (float) $digits;
    }
}
