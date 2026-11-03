<?php

namespace App\Services\Printing;

class LabelBuilder
{
    private const DOTS_PER_MM = 8;

    private const MARGIN = 8;

    private const QUIET_MODULES = 10;

    private readonly LabelRaster $raster;

    public function __construct(private readonly ArabicTextFormatter $formatter)
    {
        $this->raster = new LabelRaster($formatter, $this->layout(...));
    }

    public function raster(): LabelRaster
    {
        return $this->raster;
    }

    public function build(array $label, array $config = []): string
    {
        return ($config['protocol'] ?? 'escpos') === 'tspl'
            ? $this->buildTspl($label, $config)
            : $this->buildEscPos($label, $config);
    }

    /**
     * Lays the sticker out with the receipt's typography: the same Tahoma faces,
     * dot-measured text and a role ladder (price largest, then name, store, unit).
     * Rows carry px/bold instead of the retired printer font numbers, so the
     * raster draws exactly what the geometry measured.
     */
    public function layout(array $label, array $config = []): array
    {
        $widthMm = (float) ($config['widthMm'] ?? 50);
        $heightMm = (float) ($config['heightMm'] ?? 30);
        $widthDots = max(1, (int) round($widthMm * self::DOTS_PER_MM));
        $heightDots = max(1, (int) round($heightMm * self::DOTS_PER_MM));
        $printableWidth = max(40, $widthDots - self::MARGIN * 2);
        $availableHeight = max(1, $heightDots - self::MARGIN * 2);

        // The receipt's ladder: wider heads carry a bigger base, small stickers shrink.
        $base = $widthDots >= 560 ? 24 : ($widthDots >= 400 ? 21 : 18);

        $drafts = [];
        if (($config['showStoreName'] ?? true) && ! empty($label['storeName'])) {
            $drafts[] = $this->textDraft('storeName', $this->clean($label['storeName']), (int) round($base * 0.85), true, 1, $printableWidth);
        }
        // The unit rides at the end of the name, "Duvet (per set)", instead of taking a line of its own.
        $title = $this->nameWithUnit($this->clean($label['name'] ?? ''), $this->clean($label['unit'] ?? ''), $printableWidth, (int) round($base * 1.1));
        if ($title !== '') {
            $drafts[] = $this->textDraft('name', $title, (int) round($base * 1.1), true, 2, $printableWidth);
        }
        if (($config['showPrice'] ?? true) && isset($label['price']) && $label['price'] !== '') {
            $drafts[] = $this->textDraft('price', $this->clean($label['price']), (int) round($base * 1.45), true, 1, $printableWidth);
        }
        if (($config['showSku'] ?? false) && ! empty($label['sku'])) {
            $drafts[] = $this->textDraft('sku', 'SKU: '.$this->clean($label['sku']), (int) round($base * 0.7), false, 1, $printableWidth);
        }

        // Reading order: text first, price right under the name, and the barcode last, where
        // only the scanner needs it and its number sits on a clear bottom edge.
        if (! empty($label['barcode'])) {
            $code = $this->clean($label['barcode']);
            $readablePx = ($config['showBarcodeText'] ?? true) ? (int) round($base * 0.8) : 0;
            // The number under the bars shrinks to the paper like any single-line text.
            while ($readablePx > 10 && $this->formatter->textWidth($this->formatter->visual($code), $readablePx, false)['width'] > $printableWidth) {
                $readablePx--;
            }
            $drafts[] = [
                'kind' => 'barcode',
                'code' => $code,
                'height' => max(8, (int) round($config['barcodeHeight'] ?? 48)),
                'readablePx' => $readablePx,
            ];
        }
        $measure = function () use (&$drafts, $printableWidth): int {
            $height = 0;
            $rows = 0;
            foreach ($drafts as $draft) {
                if ($draft['kind'] === 'barcode') {
                    $height += $draft['height'] + ($draft['readablePx'] > 0 ? $this->formatter->lineHeight($draft['readablePx']) : 0);
                    $rows++;
                    continue;
                }
                $lines = $this->formatter->wrapText($draft['text'], $printableWidth, $draft['px'], $draft['bold'], $draft['maxLines']);
                $height += max(1, count($lines)) * $this->formatter->lineHeight($draft['px']);
                $rows += count($lines);
            }

            return $height + 8 * max(0, $rows - 1);
        };

        // A too-tall sticker shrinks every text role together, like the receipt's
        // shrink-to-fit, so the roles keep their relative weights.
        for ($guard = 0; $guard < 24 && $measure() > $availableHeight; $guard++) {
            $changed = false;
            foreach ($drafts as &$draft) {
                if ($draft['kind'] !== 'barcode' && $draft['px'] > 10) {
                    $draft['px'] = max(10, (int) floor($draft['px'] * 0.9));
                    $changed = true;
                }
            }
            unset($draft);
            if (! $changed) {
                break;
            }
        }
        if ($measure() > $availableHeight) {
            foreach ($drafts as &$draft) {
                if ($draft['kind'] === 'barcode') {
                    $draft['height'] = max(16, $draft['height'] - ($measure() - $availableHeight));
                    break;
                }
            }
            unset($draft);
        }

        $rows = [];
        foreach ($drafts as $draft) {
            if ($draft['kind'] === 'barcode') {
                // Code 128 needs 10 empty modules on each side to be read; the widest bar
                // that leaves them inside the printable width is the one that prints.
                $modules = Code128::modules($draft['code']);
                $narrow = min(6, max(1, intdiv($printableWidth, $modules + self::QUIET_MODULES * 2)));
                $readableWidth = $draft['readablePx'] > 0
                    ? $this->formatter->textWidth($this->formatter->visual($draft['code']), $draft['readablePx'], false)['width']
                    : 0;
                $rows[] = [
                    'type' => 'barcode',
                    'code' => $draft['code'],
                    'width' => max($modules * $narrow, $readableWidth),
                    'height' => $draft['height'],
                    'readableHeight' => $draft['readablePx'] > 0 ? $this->formatter->lineHeight($draft['readablePx']) : 0,
                    'readablePx' => $draft['readablePx'],
                    'narrow' => $narrow,
                ];
                continue;
            }

            foreach ($this->formatter->wrapText($draft['text'], $printableWidth, $draft['px'], $draft['bold'], $draft['maxLines']) as $text) {
                $rows[] = [
                    'type' => 'text',
                    'text' => $text,
                    'px' => $draft['px'],
                    'bold' => $draft['bold'],
                    'width' => $this->formatter->textWidth($this->formatter->visual($text), $draft['px'], $draft['bold'])['width'],
                    'height' => $this->formatter->lineHeight($draft['px']),
                ];
            }
        }

        $advance = fn (array $row): int => $row['type'] === 'barcode' ? $row['height'] + $row['readableHeight'] : $row['height'];
        $sumHeight = array_sum(array_map($advance, $rows));
        $gap = 8;
        if (count($rows) > 1) {
            $slack = $availableHeight - $sumHeight - 8 * (count($rows) - 1);
            if ($slack > 0) {
                $gap = min(24, 8 + intdiv($slack, count($rows) - 1));
            }
        }
        $contentHeight = $sumHeight + $gap * max(0, count($rows) - 1);
        $y = self::MARGIN + max(0, intdiv($availableHeight - $contentHeight, 2));
        foreach ($rows as &$row) {
            $row['x'] = max(0, intdiv($widthDots - $row['width'], 2));
            $row['y'] = $y;
            $y += $advance($row) + $gap;
        }
        unset($row);

        return [
            'widthDots' => $widthDots,
            'heightDots' => $heightDots,
            'rows' => $rows,
            'overflow' => $contentHeight > $availableHeight,
        ];
    }

    /**
     * "Name (unit)" that still shows the unit when the name is too long for two lines:
     * the name loses its last words and gets an ellipsis, the unit is never the part cut.
     */
    private function nameWithUnit(string $name, string $unit, int $width, int $px): string
    {
        if ($unit === '') {
            return $name;
        }
        if ($name === '') {
            return $unit;
        }

        $suffix = ' ('.$unit.')';
        $words = preg_split('/\s+/u', trim($name)) ?: [$name];
        for ($keep = count($words); $keep >= 1; $keep--) {
            $candidate = implode(' ', array_slice($words, 0, $keep)).($keep < count($words) ? '…' : '').$suffix;
            // Asking for one line more than shown reveals whether anything would be dropped.
            if (count($this->formatter->wrapText($candidate, $width, $px, true, 3)) <= 2) {
                return $candidate;
            }
        }

        return trim($suffix);
    }

    /**
     * One text role. A single-line role (price, store, unit) never wraps, so it
     * shrinks by dots until its own measurement fits the paper.
     *
     * @return array{kind: string, text: string, px: int, bold: bool, maxLines: int}
     */
    private function textDraft(string $kind, string $text, int $px, bool $bold, int $maxLines, int $printableWidth): array
    {
        if ($maxLines === 1) {
            while ($px > 10 && $this->formatter->textWidth($this->formatter->visual($text), $px, $bold)['width'] > $printableWidth) {
                $px--;
            }
        }

        return ['kind' => $kind, 'text' => $text, 'px' => $px, 'bold' => $bold, 'maxLines' => $maxLines];
    }

    /**
     * Both protocols print the identical LabelRaster pixels; only the container
     * differs. Head width caps the ESC/POS raster so a wide sticker is scaled
     * down instead of clipped by a narrower print head.
     */
    private function buildTspl(array $label, array $config): string
    {
        $widthMm = (float) ($config['widthMm'] ?? 50);
        $heightMm = (float) ($config['heightMm'] ?? 30);
        $gapMm = (float) ($config['gapMm'] ?? 2);
        $copies = max(1, min(100, (int) ($config['copies'] ?? 1)));
        $bitmap = $this->raster->render($label, $config);

        return "SIZE {$widthMm} mm, {$heightMm} mm\r\nGAP {$gapMm} mm, 0 mm\r\nDIRECTION 1\r\nCLS\r\n"
            .'BITMAP 0,0,'.$bitmap['widthBytes'].','.$bitmap['height'].',0,'.$this->tsplDots($bitmap['data'])."\r\n"
            ."PRINT {$copies}\r\n";
    }

    /**
     * TSPL burns a dot where a bit is 0 and leaves paper where it is 1, which is the
     * reverse of the ESC/POS raster the shared renderer builds, so flip every bit.
     */
    private function tsplDots(string $data): string
    {
        $bytes = '';

        for ($index = 0; $index < strlen($data); $index++) {
            $bytes .= chr(ord($data[$index]) ^ 0xFF);
        }

        return $bytes;
    }

    private function buildEscPos(array $label, array $config): string
    {
        $bitmap = $this->raster->render($label, $config, (int) ($config['rasterWidth'] ?? 576));
        $builder = new EscPosBuilder(
            $this->formatter,
            (int) ($config['lineWidth'] ?? 36),
            (string) ($config['encoding'] ?? 'cp864'),
        );
        $builder->init()->raster($bitmap)->feed(2);

        if ($config['cut'] ?? true) {
            $builder->cut();
        }

        return $builder->toString();
    }

    private function clean(mixed $value): string
    {
        return str_replace('"', '', (string) $value);
    }
}
