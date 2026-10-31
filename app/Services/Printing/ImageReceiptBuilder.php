<?php

namespace App\Services\Printing;

use RuntimeException;

/**
 * Draws the receipt as one picture instead of text the printer renders itself.
 *
 * Printers disagree about code pages, fonts and Arabic, but every ESC/POS printer
 * can print a bitmap. Drawing the whole receipt (Latin, Arabic and numbers) with
 * one font also keeps the paper consistent: mixing the printer font with image
 * Arabic looks uneven. Only barcodes, QR codes, the drawer pulse and the cut stay
 * native commands, because those are the printer's job.
 */
class ImageReceiptBuilder implements ReceiptWriter
{
    private const PADDING = 6;

    private const BAND_ROWS = 240;

    private EscPosBuilder $native;

    /** @var array<int, array<string, mixed>> */
    private array $ops = [];

    private bool $bold = false;

    private int $scale = 1;

    private string $alignment = 'left';

    private int $width;

    private int $basePx;

    private ?string $regularFont = null;

    private ?string $boldFont = null;

    private bool $boldFontResolved = false;

    public function __construct(
        private readonly ArabicTextFormatter $formatter,
        int $lineWidth = 42,
        int $rasterWidth = 560,
        private readonly bool $rtl = false,
    ) {
        $this->width = max(192, intdiv($rasterWidth, 8) * 8);
        $this->basePx = $this->width >= 480 ? 24 : 21;
        $this->native = new EscPosBuilder($formatter, $lineWidth, 'image', $this->width, $rtl);
    }

    public function init(): self
    {
        $this->native->init();

        return $this;
    }

    public function align(string $alignment): self
    {
        $this->alignment = $alignment;

        return $this;
    }

    public function bold(bool $enabled = true): self
    {
        $this->bold = $enabled;

        return $this;
    }

    public function textSize(int $width = 1, int $height = 1): self
    {
        $this->scale = max(1, min(8, max($width, $height)));

        return $this;
    }

    public function resetFormat(): self
    {
        $this->bold = false;
        $this->scale = 1;
        $this->alignment = 'left';

        return $this;
    }

    /** Line spacing is a text-mode setting; a picture has none. */
    public function lineSpacing(?int $dots): self
    {
        return $this;
    }

    public function line(string $text = '', int $fontSize = 22): self
    {
        if ($text === '') {
            return $this->feed();
        }

        $this->ops[] = ['type' => 'text', 'text' => $text, 'align' => $this->alignment, 'bold' => $this->bold, 'scale' => $this->scale];

        return $this;
    }

    public function feed(int $lines = 1): self
    {
        $this->ops[] = ['type' => 'space', 'px' => max(0, $lines) * $this->lineHeight($this->basePx)];

        return $this;
    }

    public function divider(string $character = '-'): self
    {
        $this->ops[] = ['type' => 'rule', 'style' => $character === '=' ? 'double' : 'solid'];

        return $this;
    }

    public function dashedDivider(): self
    {
        $this->ops[] = ['type' => 'rule', 'style' => 'dashed'];

        return $this;
    }

    public function twoColumns(string $label, string $amount): self
    {
        $this->ops[] = ['type' => 'pair', 'label' => $label, 'value' => $amount, 'bold' => $this->bold, 'scale' => $this->scale];

        return $this;
    }

    public function productHeader(string $nameLabel, string $quantityLabel, string $totalLabel): self
    {
        $this->ops[] = ['type' => 'item', 'name' => $nameLabel, 'quantity' => $quantityLabel, 'unit' => null, 'total' => $totalLabel, 'bold' => $this->bold, 'scale' => $this->scale];

        return $this;
    }

    public function productRow(string $name, string $quantity, ?string $unitPrice, string $total): self
    {
        // "1x" at the same price says nothing new, so the unit price only shows for other quantities.
        $showUnit = $unitPrice !== null && $unitPrice !== '' && (float) $quantity !== 1.0;

        $this->ops[] = ['type' => 'item', 'name' => $name, 'quantity' => $quantity, 'unit' => $showUnit ? $unitPrice : null, 'total' => $total, 'bold' => $this->bold, 'scale' => $this->scale];

        return $this;
    }

    public function barcode128(string $value, int $height = 60, int $width = 2, bool $showText = true): self
    {
        $ascii = preg_replace('/[^\x20-\x7E]/', '', trim($value));
        if ($ascii === null || $ascii === '') {
            return $this;
        }

        $this->flush();
        // The number under the bars is drawn with the receipt font, not the printer's.
        $this->native->barcode128($value, $height, $width, false);
        if ($showText) {
            $this->ops[] = ['type' => 'text', 'text' => $ascii, 'align' => 'center', 'bold' => false, 'scale' => 1];
        }

        return $this;
    }

    public function qrCode(string $value, int $size = 4): self
    {
        $this->flush();
        $this->native->qrCode($value, $size);

        return $this;
    }

    public function drawer(int $pin = 0): self
    {
        $this->flush();
        $this->native->drawer($pin);

        return $this;
    }

    public function cut(bool $partial = true): self
    {
        // GS V's built-in feed counts text lines, and after a raster the printer
        // has none to give — so the blank margin travels inside the picture.
        $this->ops[] = ['type' => 'space', 'px' => 3 * $this->lineHeight($this->basePx)];
        $this->flush();
        $this->native->cut($partial);

        return $this;
    }

    public function toString(): string
    {
        $this->flush();

        return $this->native->toString();
    }

    /** Draws the pending lines as one tall picture and hands it over in bands. */
    private function flush(): void
    {
        if ($this->ops === []) {
            return;
        }

        $ops = $this->ops;
        $this->ops = [];

        $commands = [];
        $y = 4;
        foreach ($ops as $op) {
            $y = $this->place($op, $y, $commands);
        }
        $height = $y + 4;

        $image = imagecreatetruecolor($this->width, $height);
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        imagefill($image, 0, 0, $white);

        foreach ($commands as $command) {
            if ($command['type'] === 'text') {
                $this->drawText($image, $black, $command);
            } else {
                $this->drawRule($image, $black, $command);
            }
        }

        $widthBytes = intdiv($this->width, 8);
        for ($start = 0; $start < $height; $start += self::BAND_ROWS) {
            $rows = min(self::BAND_ROWS, $height - $start);
            $this->native->raster([
                'widthBytes' => $widthBytes,
                'height' => $rows,
                'data' => $this->bits($image, $start, $rows),
            ]);
        }
        imagedestroy($image);
    }

    /** @param array<int, array<string, mixed>> $commands */
    private function place(array $op, int $y, array &$commands): int
    {
        $available = $this->width - 2 * self::PADDING;

        switch ($op['type']) {
            case 'space':
                return $y + (int) $op['px'];

            case 'rule':
                return $this->placeRule((string) $op['style'], $y, $commands);

            case 'text':
                $px = $this->px((int) $op['scale']);
                $lineHeight = $this->lineHeight($px);
                $align = $op['align'] === 'left' && $this->rtl ? 'right' : (string) $op['align'];

                foreach ($this->fit((string) $op['text'], $available, $px, (bool) $op['bold']) as $line) {
                    $this->addText($commands, $line, $align, self::PADDING, $available, $y, $px, (bool) $op['bold']);
                    $y += $lineHeight;
                }

                return $y + 2;

            case 'pair':
                return $this->placePair($op, $y, $commands);

            case 'item':
                return $this->placeItem($op, $y, $commands);
        }

        return $y;
    }

    /** @param array<int, array<string, mixed>> $commands */
    private function placeRule(string $style, int $y, array &$commands): int
    {
        $y += 8;
        $lines = $style === 'double' ? [0, 5] : [0];
        foreach ($lines as $offset) {
            $commands[] = [
                'type' => 'rule',
                'x1' => self::PADDING,
                'x2' => $this->width - self::PADDING,
                'y' => $y + $offset,
                'dashed' => $style === 'dashed',
            ];
        }

        return $y + ($style === 'double' ? 7 : 2) + 8;
    }

    /**
     * A label with its value on the opposite edge. A right-to-left receipt starts
     * at the right edge, so the label sits there and the value at the left.
     *
     * @param array<string, mixed> $op
     * @param array<int, array<string, mixed>> $commands
     */
    private function placePair(array $op, int $y, array &$commands): int
    {
        $bold = (bool) $op['bold'];
        $px = $this->px((int) $op['scale']);
        $lineHeight = $this->lineHeight($px);
        $available = $this->width - 2 * self::PADDING;
        $startAlign = $this->rtl ? 'right' : 'left';
        $endAlign = $this->rtl ? 'left' : 'right';

        $labelLines = $this->fit((string) $op['label'], $available, $px, $bold);
        $labelWidth = $this->box($labelLines[0], $px, $bold)['width'];
        $valueMax = $available - $labelWidth - 14;

        if (count($labelLines) > 1 || $valueMax < $available * 0.3) {
            foreach ($labelLines as $line) {
                $this->addText($commands, $line, $startAlign, self::PADDING, $available, $y, $px, $bold);
                $y += $lineHeight;
            }
            foreach ($this->fit((string) $op['value'], $available, $px, $bold) as $line) {
                $this->addText($commands, $line, $endAlign, self::PADDING, $available, $y, $px, $bold);
                $y += $lineHeight;
            }

            return $y + 4;
        }

        $valueLines = $this->fit((string) $op['value'], $valueMax, $px, $bold);
        $this->addText($commands, $labelLines[0], $startAlign, self::PADDING, $available, $y, $px, $bold);
        foreach ($valueLines as $index => $line) {
            $this->addText($commands, $line, $endAlign, self::PADDING, $available, $y + $index * $lineHeight, $px, $bold);
        }

        return $y + count($valueLines) * $lineHeight + 4;
    }

    /**
     * Name, quantity and total in three columns. The name column takes what the
     * amounts leave, and a long name wraps inside it instead of pushing them out.
     *
     * @param array<string, mixed> $op
     * @param array<int, array<string, mixed>> $commands
     */
    private function placeItem(array $op, int $y, array &$commands): int
    {
        $bold = (bool) $op['bold'];
        $px = $this->px((int) $op['scale']);
        $lineHeight = $this->lineHeight($px);
        $available = $this->width - 2 * self::PADDING;

        $quantity = $this->formatter->visual((string) $op['quantity']);
        $total = $this->formatter->visual((string) $op['total']);
        $quantityWidth = max((int) round($available * 0.14), $this->box($quantity, $px, $bold)['width'] + 10);
        $totalWidth = max((int) round($available * 0.27), $this->box($total, $px, $bold)['width'] + 10);
        $nameWidth = max(60, $available - $quantityWidth - $totalWidth - 10);

        if ($this->rtl) {
            $nameX = $this->width - self::PADDING - $nameWidth;
            $quantityX = $nameX - 10 - $quantityWidth;
            $totalX = self::PADDING;
            $nameAlign = 'right';
            $totalAlign = 'left';
        } else {
            $nameX = self::PADDING;
            $quantityX = $nameX + $nameWidth + 10;
            $totalX = $quantityX + $quantityWidth;
            $nameAlign = 'left';
            $totalAlign = 'right';
        }

        $nameLines = $this->fit((string) $op['name'], $nameWidth, $px, $bold);
        foreach ($nameLines as $index => $line) {
            $this->addText($commands, $line, $nameAlign, $nameX, $nameWidth, $y + $index * $lineHeight, $px, $bold);
        }
        $this->addText($commands, $quantity, 'center', $quantityX, $quantityWidth, $y, $px, $bold);
        $this->addText($commands, $total, $totalAlign, $totalX, $totalWidth, $y, $px, $bold);
        $y += count($nameLines) * $lineHeight;

        if ($op['unit'] !== null) {
            $smallPx = (int) round($px * 0.82);
            $this->addText($commands, $this->formatter->visual('@ '.$op['unit']), $nameAlign, $nameX, $nameWidth, $y, $smallPx, false);
            $y += $this->lineHeight($smallPx);
        }

        return $y + 6;
    }

    /**
     * Breaks logical text into lines that fit, then orders each line for the print
     * head. Wrapping has to happen before shaping: a shaped Arabic line is already
     * mirrored, so cutting it afterwards would split words from the wrong end.
     *
     * @return array<int, string>
     */
    private function fit(string $text, int $maxWidth, int $px, bool $bold): array
    {
        $whole = $this->formatter->visual($text);
        if ($this->box($whole, $px, $bold)['width'] <= $maxWidth) {
            return [$whole];
        }

        $lines = [];
        $current = '';
        foreach (preg_split('/\s+/u', trim($text)) ?: [] as $word) {
            $candidate = $current === '' ? $word : $current.' '.$word;
            if ($this->box($this->formatter->visual($candidate), $px, $bold)['width'] <= $maxWidth) {
                $current = $candidate;
                continue;
            }
            if ($current !== '') {
                $lines[] = $current;
            }
            // A single word wider than the column is cut by characters rather than clipped.
            while (mb_strlen($word) > 1 && $this->box($this->formatter->visual($word), $px, $bold)['width'] > $maxWidth) {
                $cut = mb_strlen($word) - 1;
                while ($cut > 1 && $this->box($this->formatter->visual(mb_substr($word, 0, $cut)), $px, $bold)['width'] > $maxWidth) {
                    $cut--;
                }
                $lines[] = mb_substr($word, 0, $cut);
                $word = mb_substr($word, $cut);
            }
            $current = $word;
        }
        if ($current !== '' || $lines === []) {
            $lines[] = $current;
        }

        return array_map(fn (string $line): string => $this->formatter->visual($line), $lines);
    }

    /** @param array<int, array<string, mixed>> $commands */
    private function addText(array &$commands, string $visual, string $align, int $areaX, int $areaWidth, int $top, int $px, bool $bold): void
    {
        $box = $this->box($visual, $px, $bold);
        $x = match ($align) {
            'center' => $areaX + intdiv($areaWidth - $box['width'], 2),
            'right' => $areaX + $areaWidth - $box['width'],
            default => $areaX,
        };

        $commands[] = [
            'type' => 'text',
            'text' => $visual,
            'x' => $x - $box['offset'],
            'y' => $top + (int) round($px * 1.12),
            'px' => $px,
            'bold' => $bold,
        ];
    }

    /** @return array{width: int, offset: int} */
    private function box(string $visual, int $px, bool $bold): array
    {
        if ($visual === '') {
            return ['width' => 0, 'offset' => 0];
        }

        $bounds = imagettfbbox($this->points($px), 0, $this->fontFor($bold), $visual);
        if ($bounds === false) {
            throw new RuntimeException('Unable to measure receipt text.');
        }

        return ['width' => max(1, $bounds[2] - $bounds[0]), 'offset' => $bounds[0]];
    }

    /** @param array<string, mixed> $command */
    private function drawText(\GdImage $image, int $black, array $command): void
    {
        $font = $this->fontFor((bool) $command['bold']);
        $size = $this->points((int) $command['px']);
        imagettftext($image, $size, 0, (int) $command['x'], (int) $command['y'], $black, $font, (string) $command['text']);

        // With no bold face installed, a second pass one dot over thickens the strokes.
        if ($command['bold'] && $this->boldFont() === null) {
            imagettftext($image, $size, 0, (int) $command['x'] + 1, (int) $command['y'], $black, $font, (string) $command['text']);
        }
    }

    /** @param array<string, mixed> $command */
    private function drawRule(\GdImage $image, int $black, array $command): void
    {
        for ($x = (int) $command['x1']; $x < (int) $command['x2']; $x++) {
            if ($command['dashed'] && ($x - (int) $command['x1']) % 11 >= 6) {
                continue;
            }
            imagesetpixel($image, $x, (int) $command['y'], $black);
            imagesetpixel($image, $x, (int) $command['y'] + 1, $black);
        }
    }

    private function bits(\GdImage $image, int $start, int $rows): string
    {
        $widthBytes = intdiv($this->width, 8);
        $data = '';
        for ($y = $start; $y < $start + $rows; $y++) {
            for ($byteX = 0; $byteX < $widthBytes; $byteX++) {
                $byte = 0;
                for ($bit = 0; $bit < 8; $bit++) {
                    $color = imagecolorat($image, $byteX * 8 + $bit, $y);
                    $gray = (($color >> 16) & 0xFF) + (($color >> 8) & 0xFF) + ($color & 0xFF);
                    if ($gray < 600) {
                        $byte |= 1 << (7 - $bit);
                    }
                }
                $data .= chr($byte);
            }
        }

        return $data;
    }

    private function px(int $scale): int
    {
        return (int) round($this->basePx * (1 + 0.45 * ($scale - 1)));
    }

    private function lineHeight(int $px): int
    {
        return (int) round($px * 1.5);
    }

    private function points(int $px): float
    {
        return $px * 0.75;
    }

    private function fontFor(bool $bold): string
    {
        if ($bold && ($font = $this->boldFont()) !== null) {
            return $font;
        }

        return $this->regularFont ??= $this->formatter->fontPath();
    }

    private function boldFont(): ?string
    {
        if ($this->boldFontResolved) {
            return $this->boldFont;
        }
        $this->boldFontResolved = true;

        $regular = $this->regularFont ??= $this->formatter->fontPath();
        $faces = [
            'tahoma.ttf' => 'tahomabd.ttf',
            'arial.ttf' => 'arialbd.ttf',
            'segoeui.ttf' => 'segoeuib.ttf',
            'dejavusans.ttf' => 'DejaVuSans-Bold.ttf',
        ];
        $name = strtolower(basename($regular));
        if (isset($faces[$name])) {
            $candidate = dirname($regular).DIRECTORY_SEPARATOR.$faces[$name];
            if (is_file($candidate)) {
                return $this->boldFont = $candidate;
            }
        }

        return $this->boldFont = null;
    }
}
