<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Helpers\Locale;
use App\Services\Options;
use App\Services\Printing\LabelBuilder;
use App\Services\Printing\LabelRaster;
use App\Services\Printing\PrintJobService;
use App\Services\Printing\PrinterService;
use App\Services\Printing\PrintingSettings;
use App\Services\Printing\ReceiptBuilder;
use App\Services\Printing\TestPrintSamples;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PrintingController extends Controller
{
    use Locale;

    private const ENCODINGS = ['cp864', 'cp1256', 'cp437', 'utf8'];

    public function __construct(
        protected PrinterService $printers,
        protected PrintJobService $jobs,
        protected ReceiptBuilder $receiptBuilder,
        protected LabelBuilder $labelBuilder,
        protected TestPrintSamples $samples,
        protected PrintingSettings $settings,
        protected Options $options,
    ) {
    }

    public function status()
    {
        return [
            'status' => 'online',
            'service' => 'Subul Integrated Printing',
            'version' => config('subul.version'),
            'platform' => PHP_OS_FAMILY,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function printers( Request $request )
    {
        $printers = $this->printers->printers( $request->boolean( 'refresh' ) );

        return [
            'success' => true,
            'count' => count( $printers ),
            'printers' => $printers,
        ];
    }

    public function settings()
    {
        return [
            'success' => true,
            'settings' => $this->settings->all(),
        ];
    }

    public function saveSettings( Request $request )
    {
        $validated = $request->validate( [
            'receiptPrinter' => [ 'nullable', 'string', 'max:255' ],
            'labelPrinter' => [ 'nullable', 'string', 'max:255' ],
            'lineWidth' => [ 'nullable', 'integer', 'min:20', 'max:120' ],
            'encoding' => [ 'nullable', Rule::in( self::ENCODINGS ) ],
            'cutPaper' => [ 'nullable', 'boolean' ],
            'openCashDrawer' => [ 'nullable', 'boolean' ],
            'showTaxBreakdown' => [ 'nullable', 'boolean' ],
            'copies' => [ 'nullable', 'integer', 'min:1', 'max:5' ],
            'lineSpacing' => [ 'nullable', 'integer', 'min:0', 'max:255' ],
            'autoPrintOnSale' => [ 'nullable', 'boolean' ],
            'labelWidthMm' => [ 'nullable', 'integer', 'min:20', 'max:120' ],
            'labelHeightMm' => [ 'nullable', 'integer', 'min:10', 'max:120' ],
            'labelProtocol' => [ 'nullable', Rule::in( [ 'auto', 'escpos', 'tspl' ] ) ],
            'barcodeHeight' => [ 'nullable', 'integer', 'min:8', 'max:300' ],
            'showStoreNameOnLabel' => [ 'nullable', 'boolean' ],
            'showPriceOnLabel' => [ 'nullable', 'boolean' ],
            'showSkuOnLabel' => [ 'nullable', 'boolean' ],
            'showBarcodeTextOnLabel' => [ 'nullable', 'boolean' ],
        ] );

        return [
            'success' => true,
            'settings' => $this->settings->save( $validated ),
        ];
    }

    public function receipt( Request $request )
    {
        $request->validate( [
            'printer' => [ 'nullable', 'string', 'max:255' ],
            'jobId' => [ 'nullable', 'string', 'max:120' ],
            'lang' => [ 'nullable', 'string', 'max:12', Rule::in( array_keys( (array) config( 'subul.languages', [ 'en' => 'English' ] ) ) ) ],
            'data' => [ 'required', 'array' ],
            'data.items' => [ 'sometimes', 'array' ],
            'data.items.*.name' => [ 'required', 'string', 'max:255' ],
            'config' => [ 'sometimes', 'array' ],
            'config.copies' => [ 'nullable', 'integer', 'min:1' ],
            'config.encoding' => [ 'nullable', Rule::in( self::ENCODINGS ) ],
            'config.lineWidth' => [ 'nullable', 'integer', 'min:20', 'max:120' ],
        ] );

        $locale = $this->useLanguage( $request );

        // The receipt body travels as a free-form map: validated() would prune
        // every key without its own rule, so read the raw input instead.
        $data = (array) $request->input( 'data', [] );

        if ( empty( $data[ 'items' ] ) && ! array_key_exists( 'total', $data ) ) {
            throw ValidationException::withMessages( [
                'data' => __( 'Receipt data must contain items or a total.' ),
            ] );
        }

        return $this->jobs->receipt(
            $this->target( $request->input( 'printer' ), 'receiptPrinter' ),
            $this->withStoreIdentity( $data ),
            $this->receiptConfig( (array) $request->input( 'config', [] ), $locale ),
            $this->jobId( $request, 'rcpt' ),
        );
    }

    public function labels( Request $request )
    {
        $request->validate( [
            'printer' => [ 'nullable', 'string', 'max:255' ],
            'jobId' => [ 'nullable', 'string', 'max:120' ],
            'labels' => [ 'required', 'array', 'min:1', 'max:500' ],
            'labels.*.name' => [ 'nullable', 'string', 'max:255' ],
            'labels.*.barcode' => [ 'nullable', 'string', 'max:120' ],
            'labels.*.price' => [ 'nullable', 'string', 'max:60' ],
            'labels.*.sku' => [ 'nullable', 'string', 'max:120' ],
            'labels.*.unit' => [ 'nullable', 'string', 'max:60' ],
            'labels.*.copies' => [ 'nullable', 'integer', 'min:1', 'max:100' ],
            'config' => [ 'sometimes', 'array' ],
            'config.copies' => [ 'nullable', 'integer', 'min:1' ],
            'config.protocol' => [ 'nullable', Rule::in( [ 'auto', 'escpos', 'tspl' ] ) ],
            'config.lineWidth' => [ 'nullable', 'integer', 'min:20', 'max:120' ],
        ] );

        return $this->jobs->labels(
            $this->target( $request->input( 'printer' ), 'labelPrinter' ),
            (array) $request->input( 'labels', [] ),
            $this->labelConfig( (array) $request->input( 'config', [] ) ),
            $this->jobId( $request, 'lbl' ),
        );
    }

    /**
     * Renders each label to a PNG with the exact LabelRaster pixels the printer
     * receives, so the on-screen preview is the printout instead of an approximation.
     * Identical labels in a batch render once.
     */
    public function labelPreview( Request $request )
    {
        $request->validate( [
            'labels' => [ 'required', 'array', 'min:1', 'max:500' ],
            'labels.*.name' => [ 'nullable', 'string', 'max:255' ],
            'labels.*.barcode' => [ 'nullable', 'string', 'max:120' ],
            'labels.*.price' => [ 'nullable', 'string', 'max:60' ],
            'labels.*.sku' => [ 'nullable', 'string', 'max:120' ],
            'config' => [ 'sometimes', 'array' ],
        ] );

        $config = $this->labelConfig( (array) $request->input( 'config', [] ) );
        unset( $config[ 'protocol' ] );

        $previews = [];
        $rendered = [];
        foreach ( (array) $request->input( 'labels', [] ) as $label ) {
            $label = (array) $label;
            $key = md5( (string) json_encode( [ $label, $config ] ) );
            if ( ! isset( $rendered[ $key ] ) ) {
                $raster = $this->labelBuilder->raster()->render( $label, $config );
                $rendered[ $key ] = [
                    'widthDots' => $raster[ 'widthBytes' ] * 8,
                    'heightDots' => $raster[ 'height' ],
                    'overflow' => $this->labelBuilder->layout( $label, $config )[ 'overflow' ],
                    'image' => 'data:image/png;base64,'.base64_encode( LabelRaster::pngOf( $raster ) ),
                ];
            }
            $previews[] = $rendered[ $key ];
        }

        return [ 'success' => true, 'previews' => $previews ];
    }

    public function test( Request $request )
    {
        $request->validate( [
            'printer' => [ 'nullable', 'string', 'max:255' ],
            'lang' => [ 'nullable', 'string', 'max:12', Rule::in( array_keys( (array) config( 'subul.languages', [ 'en' => 'English' ] ) ) ) ],
            'type' => [ 'nullable', Rule::in( [ 'receipt', 'label' ] ) ],
            'sample' => [ 'nullable', Rule::in( [ 'arabic', 'english', 'mixed' ] ) ],
            'protocol' => [ 'nullable', Rule::in( [ 'auto', 'escpos', 'tspl' ] ) ],
        ] );

        $type = $request->input( 'type', 'receipt' );
        $printer = $this->printers->resolveTarget( $this->target( $request->input( 'printer' ), $type === 'label' ? 'labelPrinter' : 'receiptPrinter' ) );

        if ( $type === 'label' ) {
            $config = $this->labelConfig( [ 'protocol' => $request->input( 'protocol' ) ] );
            $config[ 'protocol' ] = $config[ 'protocol' ] === 'auto'
                ? $this->printers->labelProtocol( $printer )
                : $config[ 'protocol' ];
            $bytes = $this->labelBuilder->build( $this->samples->label(), $config );
        } else {
            $bytes = $this->receiptBuilder->build( $this->samples->receipt( $request->input( 'sample', 'mixed' ) ), $this->receiptConfig( [], $this->useLanguage( $request ) ) );
        }

        $result = $this->printers->transportFor( $printer )->send( $printer, $bytes, 'Subul Test Print' );

        return [
            'success' => true,
            'printer' => $printer,
            'message' => sprintf( __( 'Test %s successfully sent to printer "%s".' ), $type, $printer ),
            'result' => $result,
        ];
    }

    public function drawer( Request $request )
    {
        $request->validate( [
            'printer' => [ 'nullable', 'string', 'max:255' ],
            'pin' => [ 'nullable', 'integer', 'in:0,1' ],
        ] );

        return $this->jobs->drawer( $this->target( $request->input( 'printer' ), 'receiptPrinter' ), (int) $request->input( 'pin', 0 ) );
    }

    /**
     * The store header and footer come from the store's own options unless the
     * caller sent them, so a sale receipt does not print the "Subul" placeholder.
     */
    private function withStoreIdentity( array $data ): array
    {
        $options = [
            'storeName' => 'sb_store_name',
            'storeAddress' => 'sb_store_address',
            'storeCity' => 'sb_store_city',
            'storePhone' => 'sb_store_phone',
            'storeEmail' => 'sb_store_email',
            'storePobox' => 'sb_store_pobox',
            'footer' => 'sb_invoice_receipt_footer',
        ];

        foreach ( $options as $field => $key ) {
            if ( trim( (string) ( $data[ $field ] ?? '' ) ) === '' ) {
                $value = trim( (string) $this->options->get( $key ) );
                if ( $value !== '' ) {
                    $data[ $field ] = $value;
                }
            }
        }

        return $data;
    }

    /**
     * A job that names no device prints on the terminal's configured printer,
     * which itself falls back to the Windows default when left empty.
     */
    private function target( ?string $printer, string $setting ): ?string
    {
        $printer = trim( (string) $printer );
        if ( $printer !== '' ) {
            return $printer;
        }

        $configured = trim( (string) $this->settings->all()[ $setting ] );

        return $configured !== '' ? $configured : null;
    }

    /**
     * Paper is read by the customer, not by the cashier's session, so a print job
     * asks for its own language instead of inheriting the dashboard locale. The API
     * routes run without LoadLangMiddleware, which leaves App::setLocale() here as
     * the only thing standing between the request and English-only labels.
     */
    private function useLanguage( Request $request ): string
    {
        $locale = trim( (string) $request->input( 'lang' ) );
        $locale = $locale !== '' ? $locale : app()->getLocale();

        App::setLocale( $locale );

        return $locale;
    }

    /**
     * Stored settings describe the terminal, the request describes this job:
     * an explicitly sent value wins, null falls back to the stored setting.
     */
    private function receiptConfig( array $overrides, string $locale = 'en' ): array
    {
        $settings = $this->settings->all();

        return [
            'lineWidth' => $overrides[ 'lineWidth' ] ?? $settings[ 'lineWidth' ],
            'encoding' => $overrides[ 'encoding' ] ?? $settings[ 'encoding' ],
            'lineSpacing' => $overrides[ 'lineSpacing' ] ?? $settings[ 'lineSpacing' ],
            'cutPaper' => $overrides[ 'cutPaper' ] ?? $settings[ 'cutPaper' ],
            'openCashDrawer' => $overrides[ 'openCashDrawer' ] ?? $settings[ 'openCashDrawer' ],
            'showTaxBreakdown' => $overrides[ 'showTaxBreakdown' ] ?? $settings[ 'showTaxBreakdown' ],
            'copies' => $overrides[ 'copies' ] ?? $settings[ 'copies' ],
            'lang' => $locale,
            'direction' => $this->isRtlLocale( $locale ) ? 'rtl' : 'ltr',
        ];
    }

    private function labelConfig( array $overrides ): array
    {
        $settings = $this->settings->all();

        return [
            'protocol' => $overrides[ 'protocol' ] ?? $settings[ 'labelProtocol' ],
            'widthMm' => $overrides[ 'widthMm' ] ?? $settings[ 'labelWidthMm' ],
            'heightMm' => $overrides[ 'heightMm' ] ?? $settings[ 'labelHeightMm' ],
            'barcodeHeight' => $overrides[ 'barcodeHeight' ] ?? $settings[ 'barcodeHeight' ],
            'showStoreName' => $overrides[ 'showStoreName' ] ?? $settings[ 'showStoreNameOnLabel' ],
            'showPrice' => $overrides[ 'showPrice' ] ?? $settings[ 'showPriceOnLabel' ],
            'showSku' => $overrides[ 'showSku' ] ?? $settings[ 'showSkuOnLabel' ],
            'showBarcodeText' => $overrides[ 'showBarcodeText' ] ?? $settings[ 'showBarcodeTextOnLabel' ],
            // How many receipt copies to print says nothing about how many labels to
            // print, and a label roll is not cut because the receipt printer is.
            'copies' => $overrides[ 'copies' ] ?? 1,
            'cut' => $overrides[ 'cut' ] ?? true,
            // Widest raster the label heads in the field print: 72 mm at 203 dpi.
            'rasterWidth' => $overrides[ 'rasterWidth' ] ?? 576,
            'encoding' => $overrides[ 'encoding' ] ?? $settings[ 'encoding' ],
            'lineWidth' => $overrides[ 'lineWidth' ] ?? $settings[ 'lineWidth' ],
            'lineSpacing' => $overrides[ 'lineSpacing' ] ?? $settings[ 'lineSpacing' ],
        ];
    }

    private function jobId( Request $request, string $prefix ): string
    {
        $jobId = $request->input( 'jobId' ) ?: $request->header( 'X-POS-Job-ID' );

        return $jobId ? (string) $jobId : $prefix.'_'.Str::orderedUuid()->toString();
    }
}
