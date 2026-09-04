<?php

namespace App\Widgets;

use App\Services\WidgetService;

class SaleCardWidget extends WidgetService
{
    protected $vueComponent = 'sbSaleCardWidget';

    public function __construct()
    {
        $this->name = __( 'Sale Card Widget' );
        $this->description = __( 'Will display current and overall sales.' );
        $this->permission = 'subul.see.sale-card-widget';
    }
}
