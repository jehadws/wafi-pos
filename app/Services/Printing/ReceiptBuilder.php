<?php

namespace App\Services\Printing;

class ReceiptBuilder
{
    public function __construct(
        private readonly ArabicTextFormatter $formatter,
        private readonly ReceiptCurrency $currency,
    ) {
    }

    /**
     * @param  array  $config  carries the job `direction` ('rtl' mirrors the columns)
     *                         alongside the paper and encoding options
     */
    public function build(array $receipt, array $config = []): string
    {
        $rtl = ( $config[ 'direction' ] ?? 'ltr' ) === 'rtl';
        $lineWidth = (int) ( $config[ 'lineWidth' ] ?? 42 );
        $builder = new EscPosBuilder(
            $this->formatter,
            $lineWidth,
            (string) ( $config[ 'encoding' ] ?? $config[ 'codePage' ] ?? 'cp864' ),
            (int) ( $config[ 'rasterWidth' ] ?? ( $lineWidth <= 36 ? 384 : 560 ) ),
            $rtl,
        );
        $builder->init();
        if ( array_key_exists( 'lineSpacing', $config ) ) {
            $builder->lineSpacing( $config[ 'lineSpacing' ] === null ? null : (int) $config[ 'lineSpacing' ] );
        }

        $builder->align( 'center' )->bold()->textSize( 2, 2 )->line( (string) ( $receipt[ 'storeName' ] ?? 'Subul' ), 34 )->resetFormat()->align( 'center' );
        $this->optionalLine( $builder, $receipt, 'storeAddress' );
        $this->optionalLine( $builder, $receipt, 'storeCity' );
        if ( ! empty( $receipt[ 'storePobox' ] ) ) {
            $builder->line( __( 'P.O.Box' ).': '.$receipt[ 'storePobox' ] );
        }
        if ( ! empty( $receipt[ 'storePhone' ] ) ) {
            $builder->line( __( 'Tel' ).': '.$receipt[ 'storePhone' ] );
        }
        $this->optionalLine( $builder, $receipt, 'storeEmail' );
        $builder->dashedDivider()->align( 'left' );

        $this->optionalPair( $builder, __( 'Order' ).':', $receipt[ 'orderCode' ] ?? null );
        $this->optionalPair( $builder, __( 'Date' ).':', $receipt[ 'date' ] ?? null );
        $this->optionalPair( $builder, __( 'Cashier' ).':', $receipt[ 'cashier' ] ?? null );
        $this->optionalPair( $builder, __( 'Customer' ).':', $receipt[ 'customer' ] ?? null );
        $this->optionalPair( $builder, __( 'Type' ).':', isset( $receipt[ 'orderType' ] ) ? strtoupper( (string) $receipt[ 'orderType' ] ) : null );
        $builder->dashedDivider();

        $builder->bold();
        $builder->productHeader( __( 'Item' ), __( 'Qty' ), __( 'Total' ) );
        $builder->resetFormat()->divider();

        foreach ( $receipt[ 'items' ] ?? [] as $item ) {
            $builder->productRow(
                (string) ( $item[ 'name' ] ?? __( 'Item' ) ),
                ( (string) ( $item[ 'quantity' ] ?? 1 ) ).'x',
                $this->money( $item[ 'price' ] ?? null, $rtl, '' ),
                $this->money( $item[ 'total' ] ?? null, $rtl, '' ),
            );
        }

        $builder->dashedDivider();
        $this->optionalAmount( $builder, __( 'Subtotal' ), $receipt[ 'subtotal' ] ?? null, $rtl );
        if ( ReceiptCurrency::parse( $receipt[ 'discount' ] ?? null ) > 0 ) {
            $builder->twoColumns( __( 'Discount' ), '-'.$this->money( $receipt[ 'discount' ], $rtl ) );
        }
        if ( ( $config[ 'showTaxBreakdown' ] ?? false ) && ! empty( $receipt[ 'taxes' ] ) ) {
            foreach ( $receipt[ 'taxes' ] as $tax ) {
                $builder->twoColumns(
                    sprintf( '  %s (%s%%)', $tax[ 'name' ] ?? __( 'Tax' ), $tax[ 'rate' ] ?? 0 ),
                    $this->money( $tax[ 'tax_value' ] ?? null, $rtl, '' ),
                );
            }
        } elseif ( ReceiptCurrency::parse( $receipt[ 'tax' ] ?? null ) > 0 ) {
            $this->optionalAmount( $builder, __( 'Tax' ), $receipt[ 'tax' ], $rtl );
        }

        $builder->divider( '=' )->bold()->textSize( 1, 2 )->twoColumns( __( 'Total' ), $this->money( $receipt[ 'total' ] ?? 0, $rtl ) )->resetFormat()->divider();
        if ( ! empty( $receipt[ 'payments' ] ) ) {
            foreach ( $receipt[ 'payments' ] as $payment ) {
                $builder->twoColumns(
                    (string) ( $payment[ 'name' ] ?? __( 'Paid' ) ),
                    $this->money( $payment[ 'value' ] ?? $payment[ 'amount' ] ?? null, $rtl, '' ),
                );
            }
        } else {
            $this->optionalAmount( $builder, __( 'Tendered' ), $receipt[ 'tendered' ] ?? null, $rtl );
        }
        $this->optionalPair( $builder, __( 'Change' ), $this->money( $receipt[ 'change' ] ?? null, $rtl ) );
        $this->optionalPair( $builder, __( 'Method' ), $receipt[ 'paymentMethod' ] ?? null );
        $builder->dashedDivider();

        if ( ! empty( $receipt[ 'barcode' ] ) ) {
            $builder->barcode128( (string) $receipt[ 'barcode' ], 50 );
        } elseif ( ! empty( $receipt[ 'qrCode' ] ) ) {
            $builder->qrCode( (string) $receipt[ 'qrCode' ] );
        }

        $builder->align( 'center' )->line( (string) ( $receipt[ 'footer' ] ?? __( 'Thank you for your business!' ) ) )->line( __( 'Powered by Subul' ) );
        if ( $config[ 'openCashDrawer' ] ?? false ) {
            $builder->drawer();
        }
        if ( $config[ 'cutPaper' ] ?? true ) {
            $builder->cut();
        } else {
            $builder->feed( 3 );
        }

        return $builder->toString();
    }

    public function drawer( int $pin = 0 ): string
    {
        return ( new EscPosBuilder( $this->formatter ) )->init()->drawer( $pin )->toString();
    }

    private function optionalLine( EscPosBuilder $builder, array $receipt, string $key ): void
    {
        if ( ! empty( $receipt[ $key ] ) ) {
            $builder->line( (string) $receipt[ $key ] );
        }
    }

    private function optionalPair( EscPosBuilder $builder, string $label, mixed $value ): void
    {
        if ( $value !== null && $value !== '' ) {
            $builder->twoColumns( $label, (string) $value );
        }
    }

    /**
     * Amounts reach the builder as numbers from the POS and as formatted text from
     * older callers; both are read through the currency formatter so a printed line
     * carries the store's own symbol, precision and separators.
     */
    private function money( mixed $value, bool $rtl, string $fallback = '' ): string
    {
        return $this->currency->format( $value, $rtl ) ?? $fallback;
    }

    private function optionalAmount( EscPosBuilder $builder, string $label, mixed $value, bool $rtl ): void
    {
        $formatted = $this->currency->format( $value, $rtl );
        if ( $formatted !== null ) {
            $builder->twoColumns( $label, $formatted );
        }
    }
}
