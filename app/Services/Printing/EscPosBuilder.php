<?php

namespace App\Services\Printing;

class EscPosBuilder
{
    private string $buffer = '';

    private string $alignment = 'left';

    public function __construct(
        private readonly ArabicTextFormatter $formatter,
        private readonly int $lineWidth = 42,
        private readonly string $encoding = 'cp864',
        private readonly int $rasterWidth = 560,
    ) {
    }

    public function init(): self
    {
        $this->bytes(0x1B, 0x40);
        $codePage = match (strtolower(str_replace('-', '', $this->encoding))) {
            'cp864' => 40,
            'cp1256' => 36,
            'cp437', 'ascii' => 0,
            default => null,
        };
        if ($codePage !== null) {
            $this->bytes(0x1B, 0x74, $codePage);
        }

        return $this;
    }

    public function align(string $alignment): self
    {
        $this->alignment = $alignment;
        $this->bytes(0x1B, 0x61, match ($alignment) {
            'center' => 1,
            'right' => 2,
            default => 0,
        });

        return $this;
    }

    public function bold(bool $enabled = true): self
    {
        $this->bytes(0x1B, 0x45, $enabled ? 1 : 0);

        return $this;
    }

    public function textSize(int $width = 1, int $height = 1): self
    {
        $width = max(1, min(8, $width)) - 1;
        $height = max(1, min(8, $height)) - 1;
        $this->bytes(0x1D, 0x21, ($width << 4) | $height);

        return $this;
    }

    public function resetFormat(): self
    {
        return $this->bold(false)->textSize()->align('left');
    }

    public function lineSpacing(?int $dots): self
    {
        if ($dots === null) {
            $this->bytes(0x1B, 0x32);
        } else {
            $this->bytes(0x1B, 0x33, max(0, min(255, $dots)));
        }

        return $this;
    }

    public function line(string $text = '', int $fontSize = 22): self
    {
        if ($this->formatter->hasArabic($text) && ! $this->formatter->supportsCodePage($this->encoding)) {
            $bitmap = $this->formatter->rasterize($text, $this->rasterWidth, $fontSize);
            $this->raster($bitmap);
        } else {
            $this->buffer .= $this->formatter->encode($text, $this->encoding);
        }
        $this->buffer .= "\n";

        return $this;
    }

    public function feed(int $lines = 1): self
    {
        $this->buffer .= str_repeat("\n", max(0, $lines));

        return $this;
    }

    public function divider(string $character = '-'): self
    {
        return $this->line(str_repeat($character, $this->lineWidth));
    }

    public function dashedDivider(): self
    {
        return $this->line(str_pad(str_repeat('- ', intdiv($this->lineWidth, 2)), $this->lineWidth, '-'));
    }

    public function twoColumns(string $left, string $right): self
    {
        $spaceCount = $this->lineWidth - mb_strlen($left) - mb_strlen($right);
        if ($spaceCount <= 0) {
            return $this->line($left)->align('right')->line($right)->align('left');
        }

        return $this->row($this->cell($left, $this->lineWidth - mb_strlen($right)).$this->cellEnd($right, mb_strlen($right)));
    }

    public function productRow(string $name, string $quantity, ?string $unitPrice, string $total): self
    {
        $quantityWidth = 6;
        $totalWidth = 14;
        $nameWidth = $this->lineWidth - $quantityWidth - $totalWidth;
        $lines = $this->wrap($name, $nameWidth);
        $this->row(
            $this->cell(array_shift($lines) ?? '', $nameWidth)
            .$this->cellEnd($quantity, $quantityWidth)
            .$this->cellEnd($total, $totalWidth),
        );

        foreach ($lines as $line) {
            $this->line($line);
        }
        if ($unitPrice !== null && $unitPrice !== '') {
            $this->row('  @ '.$this->shape($unitPrice));
        }

        return $this;
    }

    public function barcode128(string $value, int $height = 60, int $width = 2, bool $showText = true): self
    {
        $value = trim($value);
        if ($value === '') {
            return $this;
        }

        $this->align('center');
        $this->bytes(0x1D, 0x68, max(20, min(255, $height)));
        $this->bytes(0x1D, 0x77, max(1, min(6, $width)));
        $this->bytes(0x1D, 0x48, $showText ? 2 : 0);
        $this->bytes(0x1D, 0x66, 0);
        $ascii = preg_replace('/[^\x20-\x7E]/', '', $value);
        $this->bytes(0x1D, 0x6B, 73, strlen($ascii));
        $this->buffer .= $ascii."\n";

        return $this->align('left');
    }

    public function qrCode(string $value, int $size = 4): self
    {
        $length = strlen($value) + 3;
        $this->align('center');
        $this->bytes(0x1D, 0x28, 0x6B, 4, 0, 49, 65, 50, 0);
        $this->bytes(0x1D, 0x28, 0x6B, 3, 0, 49, 67, max(1, min(16, $size)));
        $this->bytes(0x1D, 0x28, 0x6B, 3, 0, 49, 69, 49);
        $this->bytes(0x1D, 0x28, 0x6B, $length % 256, intdiv($length, 256), 49, 80, 48);
        $this->buffer .= $value;
        $this->bytes(0x1D, 0x28, 0x6B, 3, 0, 49, 81, 48);

        return $this->feed()->align('left');
    }

    public function drawer(int $pin = 0): self
    {
        $this->bytes(0x1B, 0x70, $pin === 1 ? 1 : 0, 25, 250);

        return $this;
    }

    public function cut(bool $partial = true): self
    {
        $this->bytes(0x1D, 0x56, $partial ? 66 : 65, 3);

        return $this;
    }

    public function toString(): string
    {
        return $this->buffer;
    }

    private function raster(array $bitmap): void
    {
        $width = $bitmap['widthBytes'];
        $height = $bitmap['height'];
        $this->bytes(0x1D, 0x76, 0x30, 0, $width % 256, intdiv($width, 256), $height % 256, intdiv($height, 256));
        $this->buffer .= $bitmap['data'];
    }

    private function bytes(int ...$bytes): void
    {
        foreach ($bytes as $byte) {
            $this->buffer .= chr($byte);
        }
    }

    /**
     * Writes a finished, padded line. A code page that carries Arabic keeps the
     * columns; otherwise the whole line becomes one image.
     */
    private function row(string $line): self
    {
        if ($this->formatter->hasArabic($line) && ! $this->formatter->supportsCodePage($this->encoding)) {
            return $this->line($line);
        }

        $this->buffer .= $this->formatter->encodeOrdered($line, $this->encoding)."\n";

        return $this;
    }

    /** Shapes one cell only, so an Arabic name cannot mirror the amount columns. */
    private function cell(string $value, int $width): string
    {
        return $this->padEnd($this->shape($value), $width);
    }

    private function cellEnd(string $value, int $width): string
    {
        return $this->padStart($this->shape($value), $width);
    }

    /**
     * Unshaped Arabic has no code-page bytes, so it would print as "?". Shaping keeps
     * the character count, so column widths measured on the raw text still hold.
     */
    private function shape(string $value): string
    {
        if ($value !== '' && $this->formatter->hasArabic($value) && $this->formatter->supportsCodePage($this->encoding)) {
            return $this->formatter->visual($value);
        }

        return $value;
    }

    private function wrap(string $text, int $width): array
    {
        $words = preg_split('/\s+/u', trim($text)) ?: [];

        $lines = [];
        $line = '';

        foreach ($words as $word) {
            $candidate = $line === '' ? $word : "{$line} {$word}";
            if (mb_strlen($candidate) <= $width) {
                $line = $candidate;
                continue;
            }
            if ($line !== '') {
                $lines[] = $line;
            }
            while (mb_strlen($word) > $width) {
                $lines[] = mb_substr($word, 0, $width);
                $word = mb_substr($word, $width);
            }
            $line = $word;
        }

        if ($line !== '' || $lines === []) {
            $lines[] = $line;
        }

        return $lines;
    }

    private function padStart(string $value, int $length): string
    {
        return str_repeat(' ', max(0, $length - mb_strlen($value))).$value;
    }

    private function padEnd(string $value, int $length): string
    {
        return $value.str_repeat(' ', max(0, $length - mb_strlen($value)));
    }
}
