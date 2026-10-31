<?php

namespace App\Services\Printing;

class EscPosBuilder implements ReceiptWriter
{
    private string $buffer = '';

    private string $alignment = 'left';

    public function __construct(
        private readonly ArabicTextFormatter $formatter,
        private readonly int $lineWidth = 42,
        private readonly string $encoding = 'cp864',
        private readonly int $rasterWidth = 560,
        private readonly bool $rtl = false,
    ) {
    }

    public function init(): self
    {
        $this->bytes(0x1B, 0x40);
        // Cancel Chinese mode before anything else asks for a code table: a clone that
        // boots into GBK pairs up every high byte into one kanji glyph, and while that
        // mode is on it ignores ESC t, so an Arabic code page never takes effect.
        $this->bytes(0x1C, 0x2E);
        $codePage = match (strtolower(str_replace('-', '', $this->encoding))) {
            'cp864' => 40,
            'cp1256' => 36,
            'cp437', 'ascii', 'image' => 0,
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

    /**
     * A label and its amount on one line. The byte order decides where the print
     * head puts them: the first string written sits at the physical left edge, so
     * a right-to-left receipt mirrors the pair and keeps the amount at the left.
     */
    public function twoColumns(string $label, string $amount): self
    {
        [$first, $second] = $this->rtl ? [ $amount, $label ] : [ $label, $amount ];
        $spaceCount = $this->lineWidth - mb_strlen( $first ) - mb_strlen( $second );
        if ( $spaceCount <= 0 ) {
            return $this->rtl
                ? $this->align( 'right' )->line( $label )->align( 'left' )->line( $amount )
                : $this->line( $label )->align( 'right' )->line( $amount )->align( 'left' );
        }

        return $this->row( $this->cell( $first, $this->lineWidth - mb_strlen( $second ) ).$this->cellEnd( $second, mb_strlen( $second ) ) );
    }

    /**
     * The columns the printed receipt offers: the header declares them and a row that
     * needs more follows itemColumns. On a narrow receipt the amount columns give way
     * first, so a name always has something to sit in.
     *
     * @return array{int, int, int} name, quantity and total widths in characters
     */
    public function productColumns(): array
    {
        $quantityWidth = 6;
        $totalWidth = 14;
        $minimumNameWidth = 8;

        if ( $this->lineWidth < $quantityWidth + $totalWidth + $minimumNameWidth ) {
            $totalWidth = max( 6, $this->lineWidth - $quantityWidth - $minimumNameWidth );
            $quantityWidth = max( 3, min( $quantityWidth, $this->lineWidth - $totalWidth - $minimumNameWidth ) );
        }

        return [ max( 1, $this->lineWidth - $quantityWidth - $totalWidth ), $quantityWidth, $totalWidth ];
    }

    /**
     * The header over the item columns. It travels through row() rather than
     * line() so an Arabic header pads into the same columns the rows use, instead
     * of the whole line being mirrored and the amounts landing under the wrong text.
     */
    public function productHeader( string $nameLabel, string $quantityLabel, string $totalLabel ): self
    {
        return $this->row( $this->columns( $nameLabel, $quantityLabel, $totalLabel ) );
    }

    public function productRow( string $name, string $quantity, ?string $unitPrice, string $total ): self
    {
        $lines = $this->wrap( $name, $this->itemColumns( $quantity, $total )[ 0 ] );
        $this->row( $this->columns( array_shift( $lines ) ?? '', $quantity, $total ) );

        foreach ( $lines as $line ) {
            $this->rtl
                ? $this->align( 'right' )->line( $line )->align( 'left' )
                : $this->line( $line );
        }
        if ( $unitPrice !== null && $unitPrice !== '' ) {
            // The note reads from the name column, and on a mirrored receipt the name
            // column is the right margin: written unpadded it hung under the amounts.
            $this->rtl
                ? $this->row( $this->padStart( $this->shape( $unitPrice ).' @', $this->lineWidth - 2 ) )
                : $this->row( '  @ '.$this->shape( $unitPrice ) );
        }

        return $this;
    }

    /**
     * The columns one item row needs. An amount wider than its column takes the space
     * from the name column rather than pushing the line past the paper edge: a long
     * name wraps onto the next line, a number the print head breaks in half does not.
     *
     * @return array{int, int, int} name, quantity and total widths in characters
     */
    private function itemColumns( string $quantity, string $total ): array
    {
        [ , $quantityWidth, $totalWidth ] = $this->productColumns();
        $quantityWidth = max( $quantityWidth, mb_strlen( $quantity ) );
        $totalWidth = max( $totalWidth, mb_strlen( $total ) );

        return [ max( 1, $this->lineWidth - $quantityWidth - $totalWidth ), $quantityWidth, $totalWidth ];
    }

    /**
     * Name, quantity and total laid into their columns. Position alone decides the
     * padding: the first cell written anchors the physical left edge, the last the
     * right, and the middle cell keeps its amounts against the column it faces —
     * which is why the whole sequence simply reverses for a right-to-left receipt.
     */
    private function columns( string $name, string $quantity, string $total ): string
    {
        [ $nameWidth, $quantityWidth, $totalWidth ] = $this->itemColumns( $quantity, $total );
        $cells = $this->rtl
            ? [ [ $total, $totalWidth ], [ $quantity, $quantityWidth ], [ $name, $nameWidth ] ]
            : [ [ $name, $nameWidth ], [ $quantity, $quantityWidth ], [ $total, $totalWidth ] ];

        $line = '';
        foreach ( $cells as $index => [ $value, $width ] ) {
            $line .= match ( true ) {
                $index === 0 => $this->cell( $value, $width ),
                $index === count( $cells ) - 1 => $this->cellEnd( $value, $width ),
                default => $this->rtl ? $this->cell( $value, $width ) : $this->cellEnd( $value, $width ),
            };
        }

        return $line;
    }

    public function barcode128(string $value, int $height = 60, int $width = 2, bool $showText = true): self
    {
        $value = trim($value);
        if ($value === '') {
            return $this;
        }

        $ascii = preg_replace('/[^\x20-\x7E]/', '', $value);
        if ($ascii === '') {
            return $this;
        }

        $this->align('center');
        $this->bytes(0x1D, 0x68, max(20, min(255, $height)));
        $this->bytes(0x1D, 0x77, max(1, min(6, $width)));
        $this->bytes(0x1D, 0x48, $showText ? 2 : 0);
        $this->bytes(0x1D, 0x66, 0);
        // Code 128 has three code sets, and the printer has to be told which one it is
        // getting: the data starts with {A, {B or {C, and a real brace is written {{.
        $data = '{B'.str_replace('{', '{{', $ascii);
        $this->bytes(0x1D, 0x6B, 73, strlen($data));
        $this->buffer .= $data."\n";

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

    /** Emits a finished 1bpp image (see LabelRaster) as a GS v 0 raster. */
    public function raster(array $bitmap): self
    {
        $width = $bitmap['widthBytes'];
        $height = $bitmap['height'];
        $this->align('center');
        $this->bytes(0x1D, 0x76, 0x30, 0, $width % 256, intdiv($width, 256), $height % 256, intdiv($height, 256));
        $this->buffer .= $bitmap['data'];

        return $this->align('left');
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
