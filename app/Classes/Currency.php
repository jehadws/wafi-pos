<?php

namespace App\Classes;

use App\Services\CurrencyService;

class Currency
{
    public static function define( $amount )
    {
        return sb()->currency->define( $amount );
    }

    /**
     * Will return a new intance using
     * the default value.
     *
     * @param float $amount
     */
    public static function fresh( $amount ): CurrencyService
    {
        return sb()->currency->fresh( $amount );
    }

    public static function raw( $amount )
    {
        return sb()->currency->define( $amount )->toFloat();
    }
}
