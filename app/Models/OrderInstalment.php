<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int    $id
 * @property float  $amount
 * @property int    $order_id
 * @property bool   $paid
 * @property int    $payment_id
 * @property string $date
 */
class OrderInstalment extends SbModel
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'subul_' . 'orders_instalments';

    protected $casts = [
        'paid' => 'boolean',
    ];
}
