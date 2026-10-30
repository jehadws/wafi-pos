<?php

namespace App\Services\Printing;

use App\Services\Options;

/**
 * Formats money for paper.
 *
 * The screen builds amounts with `formatCurrency()` from the same `sb_currency_*`
 * options, so a receipt line reads exactly like the cart line it came from. Two
 * differences matter on paper: the result never carries stray spaces (a column is
 * padded by the caller, and a hidden trailing space pushes every amount left), and
 * an Arabic symbol on a receipt written in a left-to-right language is replaced by
 * its ISO code, because the reader of that receipt does not read the symbol.
 */
class ReceiptCurrency
{
    public function __construct( private readonly Options $options, private readonly ArabicTextFormatter $formatter )
    {
    }

    /**
     * @return string|null Null means "print no line at all", which keeps every
     *                     optional amount on the receipt optional.
     */
    public function format( mixed $value, bool $rtl = false ): ?string
    {
        $amount = self::parse( $value );
        if ( $amount === null ) {
            return null;
        }

        $config = $this->config();
        $digits = number_format( $amount, $config[ 'precision' ], $config[ 'decimalSeparator' ], $config[ 'thousandSeparator' ] );
        $token = $this->token( $rtl, $config );

        if ( $token === '' ) {
            return $digits;
        }

        return $config[ 'position' ] === 'after' ? $digits.$token : $token.$digits;
    }

    /**
     * Accepts a raw number and the pre-formatted strings older callers still send
     * ("36.00", "1.234,56", "$5.00"). Casting formatted text to a float reads only
     * the leading digits, so the number is lifted out of the text instead.
     */
    public static function parse( mixed $value ): ?float
    {
        if ( $value === null || $value === '' || is_array( $value ) ) {
            return null;
        }

        if ( is_numeric( $value ) ) {
            return (float) $value;
        }

        $digits = preg_replace( '/[^\d.,-]/u', '', (string) $value ) ?? '';

        if ( ! preg_match( '/\d/', $digits ) ) {
            return null;
        }

        if ( str_contains( $digits, ',' ) && str_contains( $digits, '.' ) ) {
            $digits = strrpos( $digits, '.' ) > strrpos( $digits, ',' )
                ? str_replace( ',', '', $digits )
                : str_replace( [ '.', ',' ], [ '', '.' ], $digits );
        } elseif ( str_contains( $digits, ',' ) ) {
            $digits = str_replace( ',', '.', $digits );
        }

        return (float) $digits;
    }

    /**
     * Whether an amount is present at all, so `0` can still print a zero line
     * while a missing value prints nothing.
     */
    public static function has( mixed $value ): bool
    {
        return self::parse( $value ) !== null;
    }

    /**
     * @return array{symbol:string,iso:string,position:string,precision:int,decimalSeparator:string,thousandSeparator:string}
     */
    private function config(): array
    {
        return [
            'symbol' => (string) $this->options->get( 'sb_currency_symbol', '$' ),
            'iso' => (string) $this->options->get( 'sb_currency_iso', '' ),
            'position' => $this->options->get( 'sb_currency_position', 'before' ) === 'after' ? 'after' : 'before',
            // Precision 0 is a deliberate setting, so it must not fall through to 2.
            'precision' => $this->precision(),
            'decimalSeparator' => (string) $this->options->get( 'sb_currency_decimal_separator', '.' ),
            'thousandSeparator' => (string) $this->options->get( 'sb_currency_thousand_separator', ',' ),
        ];
    }

    private function precision(): int
    {
        $stored = $this->options->get( 'sb_currency_precision', 2 );

        return ctype_digit( (string) $stored ) ? max( 0, min( 5, (int) $stored ) ) : 2;
    }

    private function token( bool $rtl, array $config ): string
    {
        $symbol = trim( $config[ 'symbol' ] );

        if ( ! $rtl && $this->formatter->hasArabic( $symbol ) ) {
            // An English receipt reads its ISO code; without one the spelled-out
            // currency beats a line of glyphs the reader cannot use.
            return $config[ 'iso' ] !== '' ? $config[ 'iso' ] : $this->formatter->toLatinCurrency( $symbol );
        }

        return $symbol;
    }
}
