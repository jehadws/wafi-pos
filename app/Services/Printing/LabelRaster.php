<?php

namespace App\Services\Printing;

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
                $this->drawText($canvas, $black, (string) $row['text'], $x, $y, max(6, (int) round($row['px'] * $scale)), (bool) $row['bold'], $width);
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
     * Draws one visual line exactly like the receipt builder: the measured text
     * starts at x, and the baseline sits at 1.12 px into the cell so the ink is
     * centered in the row's 1.5 px line height.
     */
    private function drawText(\GdImage $canvas, int $color, string $text, int $x, int $y, int $px, bool $bold, int $canvasWidth): void
    {
        $visual = $this->formatter->visual($text);
        if (trim($visual) === '') {
            return;
        }

        $font = $this->formatter->fontFor($bold);
        $size = $this->formatter->points($px);
        $box = $this->formatter->textWidth($visual, $px, $bold);
        $left = max(1, min($canvasWidth - $box['width'] - 1, $x - $box['offset']));
        $baseline = $y + (int) round($px * 1.12);

        imagettftext($canvas, $size, 0, $left, $baseline, $color, $font, $visual);

        // With no bold face installed, a second pass one dot over thickens the strokes.
        if ($bold && $this->formatter->boldFontPath() === null) {
            imagettftext($canvas, $size, 0, $left + 1, $baseline, $color, $font, $visual);
        }
    }

    private function drawBarcode(\GdImage $canvas, int $color, array $row, int $x, int $y, float $scale, int $canvasWidth): void
    {
        $bars = Code128::runs($row['code']);
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

        if (($row['readablePx'] ?? 0) > 0) {
            // Centered under the bars, the way a scanner-side human reads a retail code.
            $readablePx = max(6, (int) round($row['readablePx'] * $scale));
            $readableWidth = $this->formatter->textWidth($this->formatter->visual($row['code']), $readablePx, false)['width'];
            $this->drawText(
                $canvas,
                $color,
                $row['code'],
                $center - intdiv($readableWidth, 2),
                $y + (int) floor($row['height'] * $scale) + 2,
                $readablePx,
                false,
                $canvasWidth,
            );
        }
    }

    /** Symbol value to bar/space widths, start characters included. */
    public static function patterns(): array
    {
        return Code128::patterns();
    }
}
