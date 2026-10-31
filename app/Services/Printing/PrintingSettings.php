<?php

namespace App\Services\Printing;

use App\Services\Options;

/**
 * Direct-thermal printer settings, persisted as sb options so a terminal keeps
 * its printer choice for every cashier and browser instead of one localStorage blob.
 */
class PrintingSettings
{
    /**
     * Arabic is always drawn as an image. A printer's own code page is a per-model
     * guess (the table number behind ESC t differs between makers, and many clones
     * have no Arabic table), while a raster works on every ESC/POS printer. Stored
     * or client-sent code pages from older versions are therefore ignored.
     */
    public const ENCODING = 'image';

    private const SCHEMA = [
        'receiptPrinter' => [ 'sb_subul_printing_receipt_printer', 'string', '' ],
        'labelPrinter' => [ 'sb_subul_printing_label_printer', 'string', '' ],
        'lineWidth' => [ 'sb_subul_printing_line_width', 'int', 42 ],
        'encoding' => [ 'sb_subul_printing_encoding', 'string', 'image' ],
        'cutPaper' => [ 'sb_subul_printing_cut_paper', 'bool', true ],
        'openCashDrawer' => [ 'sb_subul_printing_cash_drawer', 'bool', false ],
        'showTaxBreakdown' => [ 'sb_subul_printing_tax_breakdown', 'bool', true ],
        'copies' => [ 'sb_subul_printing_copies', 'int', 1 ],
        'lineSpacing' => [ 'sb_subul_printing_line_spacing', 'nullable_int', null ],
        'autoPrintOnSale' => [ 'sb_subul_printing_auto', 'bool', true ],
        'labelWidthMm' => [ 'sb_subul_printing_label_width_mm', 'int', 50 ],
        'labelHeightMm' => [ 'sb_subul_printing_label_height_mm', 'int', 30 ],
        'labelProtocol' => [ 'sb_subul_printing_label_protocol', 'string', 'auto' ],
        'barcodeHeight' => [ 'sb_subul_printing_barcode_height', 'int', 45 ],
        'showStoreNameOnLabel' => [ 'sb_subul_printing_label_store_name', 'bool', true ],
        'showPriceOnLabel' => [ 'sb_subul_printing_label_price', 'bool', true ],
        'showSkuOnLabel' => [ 'sb_subul_printing_label_sku', 'bool', false ],
        'showBarcodeTextOnLabel' => [ 'sb_subul_printing_label_barcode_text', 'bool', true ],
    ];

    public function __construct( private readonly Options $options )
    {
    }

    public function all(): array
    {
        $settings = [];

        foreach ( self::SCHEMA as $name => [ $key, $type, $default ] ) {
            $stored = $this->options->get( $key );
            $settings[ $name ] = $stored === null || $stored === ''
                ? $default
                : $this->cast( (string) $type, (string) $stored, $default );
        }

        $settings[ 'encoding' ] = self::ENCODING;

        return $settings;
    }

    /**
     * Persist only the recognised settings and return the stored result, so the
     * caller always reads back the same cast values the next request will get.
     */
    public function save( array $settings ): array
    {
        foreach ( self::SCHEMA as $name => [ $key, $type, $default ] ) {
            if ( ! array_key_exists( $name, $settings ) ) {
                continue;
            }

            $value = $settings[ $name ];

            if ( $type === 'nullable_int' && ( $value === null || $value === '' ) ) {
                $this->options->delete( $key );
                continue;
            }

            $this->options->set( $key, $this->toStored( (string) $type, $value, $default ) );
        }

        return $this->all();
    }

    private function cast( string $type, string $stored, mixed $default ): mixed
    {
        return match ( $type ) {
            'int', 'nullable_int' => (int) $stored,
            'bool' => in_array( strtolower( $stored ), [ 'yes', '1', 'true' ], true ),
            default => $stored,
        };
    }

    private function toStored( string $type, mixed $value, mixed $default ): mixed
    {
        return match ( $type ) {
            'int', 'nullable_int' => (int) $value,
            'bool' => $value ? 'yes' : 'no',
            default => trim( (string) $value ),
        };
    }
}
