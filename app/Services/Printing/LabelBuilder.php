<?php

namespace App\Services\Printing;

class LabelBuilder
{
    private const DOTS_PER_MM = 8;

    private const FONT_WIDTH = [1 => 8, 2 => 12, 3 => 16];

    private const FONT_HEIGHT = [1 => 16, 2 => 24, 3 => 32];

    private const MARGIN = 8;

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

    public function layout(array $label, array $config = []): array
    {
        $widthMm = (float) ($config['widthMm'] ?? 50);
        $heightMm = (float) ($config['heightMm'] ?? 30);
        $widthDots = max(1, (int) round($widthMm * self::DOTS_PER_MM));
        $heightDots = max(1, (int) round($heightMm * self::DOTS_PER_MM));
        $printableWidth = $widthDots - self::MARGIN * 2;
        $availableHeight = $heightDots - self::MARGIN * 2;
        $drafts = [];

        if (($config['showStoreName'] ?? true) && ! empty($label['storeName'])) {
            $text = $this->clean($label['storeName']);
            $drafts[] = ['kind' => 'storeName', 'font' => 1, 'text' => $text, 'scale' => $this->fitScale(1, $text, $printableWidth, 2)];
        }
        if (! empty($label['name'])) {
            $text = $this->clean($label['name']);
            $scale = 1;
            foreach ([3, 2, 1] as $candidate) {
                if (mb_strlen($text) <= intdiv($printableWidth, self::FONT_WIDTH[2] * $candidate) * 2) {
                    $scale = $candidate;
                    break;
                }
            }
            $drafts[] = ['kind' => 'name', 'font' => 2, 'text' => $text, 'scale' => $scale];
        }
        if (! empty($label['barcode'])) {
            $drafts[] = [
                'kind' => 'barcode',
                'code' => $this->clean($label['barcode']),
                'height' => max(8, (int) round($config['barcodeHeight'] ?? 48)),
                'readableHeight' => ($config['showBarcodeText'] ?? true) ? self::FONT_HEIGHT[2] : 0,
            ];
        }
        if (($config['showPrice'] ?? true) && isset($label['price']) && $label['price'] !== '') {
            $text = $this->clean($label['price']);
            $drafts[] = ['kind' => 'price', 'font' => 3, 'text' => $text, 'scale' => $this->fitScale(3, $text, $printableWidth, 2)];
        }
        if (($config['showSku'] ?? false) && ! empty($label['sku'])) {
            $drafts[] = ['kind' => 'sku', 'font' => 1, 'text' => 'SKU: '.$this->clean($label['sku']), 'scale' => 1];
        }

        $measure = function () use (&$drafts, $printableWidth): array {
            $height = 0;
            $rows = 0;
            foreach ($drafts as $draft) {
                if ($draft['kind'] === 'barcode') {
                    $height += $draft['height'] + $draft['readableHeight'];
                    $rows++;
                    continue;
                }
                $count = 1;
                if ($draft['kind'] === 'name') {
                    $length = max(1, intdiv($printableWidth, self::FONT_WIDTH[$draft['font']] * $draft['scale']));
                    $count = count($this->wrap($draft['text'], $length, 2));
                }
                $height += self::FONT_HEIGHT[$draft['font']] * $draft['scale'] * $count;
                $rows += $count;
            }

            return ['height' => $height + 8 * max(0, $rows - 1), 'rows' => $rows];
        };

        while ($measure()['height'] > $availableHeight) {
            $changed = false;
            foreach (['storeName', 'name', 'price'] as $kind) {
                foreach ($drafts as &$draft) {
                    if ($draft['kind'] === $kind && $draft['scale'] > 1) {
                        $draft['scale']--;
                        $changed = true;
                        break 2;
                    }
                }
                unset($draft);
            }
            if (! $changed) {
                break;
            }
        }
        unset($draft);
        if ($measure()['height'] > $availableHeight) {
            foreach ($drafts as &$draft) {
                if ($draft['kind'] === 'barcode') {
                    $draft['height'] = max(16, $draft['height'] - ($measure()['height'] - $availableHeight));
                    break;
                }
            }
            unset($draft);
        }

        $rows = [];
        foreach ($drafts as $draft) {
            if ($draft['kind'] === 'barcode') {
                $modules = $this->code128Modules($draft['code']);
                $narrow = min(6, max(1, (int) floor(($printableWidth * 0.9) / $modules)));
                $rows[] = [
                    'type' => 'barcode',
                    'code' => $draft['code'],
                    'width' => $modules * $narrow,
                    'height' => $draft['height'],
                    'readableHeight' => $draft['readableHeight'],
                    'narrow' => $narrow,
                ];
                continue;
            }

            $lineLength = max(1, intdiv($printableWidth, self::FONT_WIDTH[$draft['font']] * $draft['scale']));
            $lines = $draft['kind'] === 'name' ? $this->wrap($draft['text'], $lineLength, 2) : [mb_substr($draft['text'], 0, $lineLength)];
            foreach ($lines as $text) {
                $rows[] = [
                    'type' => 'text',
                    'font' => $draft['font'],
                    'scale' => $draft['scale'],
                    'text' => $text,
                    'width' => mb_strlen($text) * self::FONT_WIDTH[$draft['font']] * $draft['scale'],
                    'height' => self::FONT_HEIGHT[$draft['font']] * $draft['scale'],
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

    private function fitScale(int $font, string $text, int $width, int $cap): int
    {
        return min($cap, max(1, intdiv($width, max(1, mb_strlen($text)) * self::FONT_WIDTH[$font])));
    }

    private function code128Modules(string $code): int
    {
        $symbols = ctype_digit($code) ? (int) ceil(strlen($code) / 2) + 2 : strlen($code) + 2;

        return $symbols * 11 + 13;
    }

    private function wrap(string $text, int $maxLength, int $maxLines): array
    {
        $lines = [];
        $line = '';
        foreach (preg_split('/\s+/u', trim($text)) ?: [] as $word) {
            $candidate = $line === '' ? $word : "{$line} {$word}";
            if (mb_strlen($candidate) <= $maxLength) {
                $line = $candidate;
                continue;
            }
            if ($line !== '') {
                $lines[] = $line;
                if (count($lines) === $maxLines) {
                    return $lines;
                }
            }
            $line = $word;
        }
        if ($line !== '' && count($lines) < $maxLines) {
            $lines[] = mb_substr($line, 0, $maxLength);
        }

        return $lines;
    }

    private function clean(mixed $value): string
    {
        return str_replace('"', '', (string) $value);
    }
}
