<?php

namespace App\Services\Printing;

/**
 * What ReceiptBuilder needs from a receipt printer. EscPosBuilder writes text
 * lines the printer draws with its own font; ImageReceiptBuilder draws the whole
 * receipt as one picture, so the paper looks the same on every printer.
 */
interface ReceiptWriter
{
    public function init(): self;

    public function align(string $alignment): self;

    public function bold(bool $enabled = true): self;

    public function textSize(int $width = 1, int $height = 1): self;

    public function resetFormat(): self;

    public function lineSpacing(?int $dots): self;

    public function line(string $text = '', int $fontSize = 22): self;

    public function feed(int $lines = 1): self;

    public function divider(string $character = '-'): self;

    public function dashedDivider(): self;

    public function twoColumns(string $label, string $amount): self;

    public function productHeader(string $nameLabel, string $quantityLabel, string $totalLabel): self;

    public function productRow(string $name, string $quantity, ?string $unitPrice, string $total): self;

    public function barcode128(string $value, int $height = 60, int $width = 2, bool $showText = true): self;

    public function qrCode(string $value, int $size = 4): self;

    public function drawer(int $pin = 0): self;

    public function cut(bool $partial = true): self;

    public function toString(): string;
}
