<?php

namespace App\Widgets;

use App\Services\WidgetService;

class OrdersSummaryWidget extends WidgetService
{
    protected $vueComponent = 'sbOrdersSummary';

    public function __construct()
    {
        $this->name = __( 'Orders Summary' );
        $this->description = __( 'Will display a summary of recent sales.' );
        $this->permission = 'subul.see.orders-summary-widget';
    }
}
