<?php

namespace App\Widgets;

use App\Services\WidgetService;

class OrdersSummaryWidget extends WidgetService
{
    protected $vueComponent = 'nsOrdersSummary';

    public function __construct()
    {
        $this->name = __( 'Orders Summary' );
        $this->description = __( 'Will display a summary of recent sales.' );
        $this->permission = 'jgrem.see.orders-summary-widget';
    }
}
