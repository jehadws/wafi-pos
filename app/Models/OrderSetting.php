<?php

namespace App\Models;

/**
 * @property int    $id
 * @property mixed  $order_id
 * @property string $key
 * @property string $value
 * @property mixed  $created_at
 * @property mixed  $updated_at
 */
class OrderSetting extends SbModel
{
    protected $fillable = [
        'key', 'value', 'order_id',
    ];

    protected $table = 'subul_orders_settings';

    public function order()
    {
        return $this->belongsTo( Order::class );
    }
}
