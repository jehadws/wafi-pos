<?php

namespace App\Services\Printing;

use RuntimeException;

/**
 * Composites a whole label onto a one-bit canvas at the printer's native dots
 * (203 dpi, 8 dots per mm) using LabelBuilder::layout() geometry, so the ESC/POS
 * raster, the TSPL BITMAP and the on-screen preview are the same pixels.
 *
 * The printer's built-in fonts cannot shape Arabic and its native BARCODE command
 * rescales modules to whatever it likes, so every row including the bars is drawn
 * here at exact dot widths.
 */
class LabelRaster
{
    /** Code 128 bar/space widths for symbol values 0..102, one digit per element, each row 11 modules. */
    private const CODE128_PATTERNS = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
        '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
        '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
        '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
        '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
        '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
        '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
        '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
        '114131', '311141', '411131',
    ];

    /** Start characters select the numbering; the stop character carries an extra module. */
    private const CODE128_STARTS = [
        103 => '211412',
        104 => '211214',
        105 => '211232',
        106 => '2331112',
    ];

    /** @var callable(array,array):array Layout geometry to draw, normally LabelBuilder::layout(). */
    private $layout;

    public function __construct(private readonly ArabicTextFormatter $formatter, ?callable $layout = null)
    {
        $this->layout = $layout ?? static function (array $label, array $config) use ($formatter): array {
            static $builder = null;
            $builder ??= new LabelBuilder($formatter);

            return $builder->layout($label, $config);
        };
    }

    /**
     * @param  int|null  $maxWidthDots  printable width of the target head; the label is scaled down to fit
     * @return array{widthBytes:int, height:int, data:string} 1bpp raster, bit 7 = leftmost dot, 1 = burned dot
     */
    public function render(array $label, array $config = [], ?int $maxWidthDots = null): array
    {
        $layout = ($this->layout)($label, $config);
        $scale = $maxWidthDots === null || $maxWidthDots <= 0 || $layout['widthDots'] <= $maxWidthDots
            ? 1
            : max(0.25, $maxWidthDots / $layout['widthDots']);

        $width = max(1, (int) floor($layout['widthDots'] * $scale));
        $height = max(1, (int) floor($layout['heightDots'] * $scale));
        $canvas = imagecreatetruecolor($width, $height);
        imagefilledrectangle($canvas, 0, 0, $width, $height, imagecolorallocate($canvas, 255, 255, 255));

        $black = imagecolorallocate($canvas, 0, 0, 0);
        foreach ($layout['rows'] as $row) {
            $x = (int) floor($row['x'] * $scale);
            $y = (int) floor($row['y'] * $scale);
            if ($row['type'] === 'barcode') {
                $this->drawBarcode($canvas, $black, $row, $x, $y, $scale, $width);
            } else {
                $this->drawText($canvas, $black, $row['text'], $x, $y, (int) floor($row['width'] * $scale), (int) floor($row['height'] * $scale), $width);
            }
        }

        $widthBytes = intdiv($width + 7, 8);
        $data = '';
        for ($py = 0; $py < $height; $py++) {
            $byte = 0;
            for ($bit = 0; $bit < $widthBytes * 8; $bit++) {
                if ($bit % 8 === 0 && $bit > 0) {
                    $data .= chr($byte);
                    $byte = 0;
                }
                if ($bit < $width && $this->isInk($canvas, $bit, $py)) {
                    $byte |= 1 << (7 - $bit % 8);
                }
            }
            $data .= chr($byte);
        }
        imagedestroy($canvas);

        return ['widthBytes' => $widthBytes, 'height' => $height, 'data' => $data];
    }

    /** PNG of the same pixels the printer burns, for the on-screen preview. */
    public function png(array $label, array $config = [], ?int $maxWidthDots = null): string
    {
        return self::pngOf($this->render($label, $config, $maxWidthDots));
    }

    /** PNG of an already rendered bitmap, so a caller that measured it does not draw it twice. */
    public static function pngOf(array $bitmap): string
    {
        [$width, $height] = [$bitmap['widthBytes'] * 8, $bitmap['height']];
        $image = imagecreatetruecolor($width, $height);
        imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocate($image, 255, 255, 255));
        $black = imagecolorallocate($image, 0, 0, 0);
        $rows = array_chunk(str_split($bitmap['data']), $bitmap['widthBytes']);
        foreach ($rows as $py => $rowBytes) {
            foreach ($rowBytes as $byteIndex => $byte) {
                for ($bit = 0; $bit < 8; $bit++) {
                    if (ord($byte) & (1 << (7 - $bit))) {
                        imagesetpixel($image, $byteIndex * 8 + $bit, $py, $black);
                    }
                }
            }
        }
        ob_start();
        imagepng($image);
        imagedestroy($image);

        return (string) ob_get_clean();
    }

    private function isInk(\GdImage $canvas, int $x, int $y): bool
    {
        $color = imagecolorat($canvas, $x, $y);

        return (($color >> 16) & 0xFF) < 160;
    }

    /**
     * Draws the visual (shaped, reordered) string with the shared TrueType font.
     * The layout reserves cell heights sized to letter caps, so the font is picked
     * so a digit's cap height fills the cell and the digits are centered on it.
     */
    private function drawText(\GdImage $canvas, int $color, string $text, int $x, int $y, int $cellWidth, int $cellHeight, int $canvasWidth): void
    {
        $visual = $this->formatter->visual($text);
        if (trim($visual) === '') {
            return;
        }

        $font = $this->formatter->fontPath();
        $target = max(6, (int) round($cellHeight * 0.72));
        $size = min((float) max(8, $cellHeight), $this->fitFont($visual, $font, $target, $canvasWidth - 2));

        $bounds = imagettfbbox($size, 0, $font, $visual);
        $digits = imagettfbbox($size, 0, $font, '0');
        if ($bounds === false || $digits === false) {
            throw new RuntimeException('Unable to measure label text.');
        }

        $textWidth = max(1, $bounds[2] - $bounds[0]);
        $center = $x + intdiv($cellWidth, 2);
        $left = max(1, min($canvasWidth - $textWidth - 1, $center - intdiv($textWidth, 2)));
        $baseline = $y + intdiv($cellHeight, 2) + intdiv($digits[1] - $digits[7], 2);
        imagettftext($canvas, $size, 0, $left - $bounds[0], $baseline, $color, $font, $visual);
    }

    private function fitFont(string $visual, string $font, int $targetHeight, int $maxWidth): float
    {
        for ($size = (float) $targetHeight; $size > 6; $size -= 0.5) {
            $bounds = imagettfbbox($size, 0, $font, $visual);
            if ($bounds !== false && ($bounds[2] - $bounds[0]) <= $maxWidth && ($bounds[1] - $bounds[7]) <= $targetHeight) {
                return $size;
            }
        }

        return 6.0;
    }

    private function drawBarcode(\GdImage $canvas, int $color, array $row, int $x, int $y, float $scale, int $canvasWidth): void
    {
        $bars = $this->code128Bars($row['code']);
        if ($bars === null) {
            return;
        }

        $modules = array_sum($bars);
        $narrow = max(1, (int) floor(min($row['narrow'], ($canvasWidth - 2 * max(1, $x)) / $modules) * ($scale < 1 ? $scale : 1)));
        $totalWidth = $modules * $narrow;
        $center = $x + intdiv((int) floor($row['width'] * $scale), 2);
        $left = max(1, min($canvasWidth - $totalWidth - 1, $center - intdiv($totalWidth, 2)));

        $cursor = $left;
        foreach ($bars as $index => $run) {
            if ($index % 2 === 0) {
                $runWidth = $run * $narrow;
                imagefilledrectangle($canvas, $cursor, $y, $cursor + $runWidth - 1, $y + (int) floor($row['height'] * $scale) - 1, $color);
            }
            $cursor += $run * $narrow;
        }

        if ($row['readableHeight'] > 0) {
            $this->drawText(
                $canvas,
                $color,
                $row['code'],
                $left,
                $y + (int) floor($row['height'] * $scale) + 2,
                $totalWidth,
                (int) floor($row['readableHeight'] * $scale) - 2,
                $canvasWidth,
            );
        }
    }

    /**
     * Code 128 run lengths (bar, space, bar, ...) including the stop character.
     * Digits are encoded two per symbol, every other ASCII character one per symbol.
     *
     * @return list<int>|null
     */
    private function code128Bars(string $code): ?array
    {
        $ascii = preg_replace('/[^\x20-\x7E]/', '', $code) ?? '';
        if ($ascii === '') {
            return null;
        }

        // Code C halves the symbol count for pure digits; anything else rides
        // Code B one character per symbol.
        $compact = ctype_digit($ascii) && strlen($ascii) % 2 === 0;
        $values = [$compact ? 105 : 104];
        if ($compact) {
            foreach (str_split($ascii, 2) as $pair) {
                $values[] = (int) $pair;
            }
        } else {
            foreach (unpack('C*', $ascii) ?: [] as $byte) {
                $values[] = $byte - 32;
            }
        }

        $checksum = $values[0];
        for ($position = 1; $position < count($values); $position++) {
            $checksum += $values[$position] * $position;
        }
        $values[] = $checksum % 103;

        $runs = [];
        foreach ([...$values, 106] as $value) {
            foreach (str_split($this->pattern($value)) as $run) {
                $runs[] = (int) $run;
            }
        }

        return $runs;
    }

    private function pattern(int $value): string
    {
        return self::CODE128_STARTS[$value] ?? self::CODE128_PATTERNS[$value];
    }

    /** Symbol value to bar/space widths, start and stop characters included. */
    public static function patterns(): array
    {
        return self::CODE128_PATTERNS + self::CODE128_STARTS;
    }
}
