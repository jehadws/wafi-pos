<?php

namespace App\Models;

use App\Events\OrderPaymentAfterCreatedEvent;
use App\Events\OrderPaymentAfterUpdatedEvent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Cache;

/**
 * @property int    $id
 * @property int    $order_id
 * @property float  $value
 * @property int    $author
 * @property string $identifier
 * @property string $uuid
 */
class OrderPayment extends SbModel
{
    use HasFactory;

    protected $table = 'subul_' . 'orders_payments';

    const PAYMENT_CASH = 'cash-payment';

    const PAYMENT_ACCOUNT = 'account-payment';

    const PAYMENT_BANK = 'bank-payment';

    public $dispatchesEvents = [
        'created' => OrderPaymentAfterCreatedEvent::class,
        'updated' => OrderPaymentAfterUpdatedEvent::class,
    ];

    public function order()
    {
        return $this->belongsTo( Order::class, 'order_id', 'id' );
    }

    public function scopeWithOrder( $query, $order_id )
    {
        return $query->where( 'order_id', $order_id );
    }

    public function type()
    {
        return $this->hasOne( PaymentType::class, 'identifier', 'identifier' );
    }

    public function getPaymentLabelAttribute()
    {
        $paymentTypes = Cache::remember( 'subul.pos.payments-key', '3600', function () {
            return PaymentType::active()->get()->mapWithKeys( function ( $paymentType ) {
                return [ $paymentType->identifier => $paymentType->label ];
            } );
        } );

        return $paymentTypes[ $this->identifier ] ?? __( 'Unknown Payment' );
    }
}
