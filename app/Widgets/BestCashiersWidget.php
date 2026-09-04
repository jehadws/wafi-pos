<?php

namespace App\Widgets;

use App\Services\WidgetService;

class BestCashiersWidget extends WidgetService
{
    protected $vueComponent = 'sbBestCashiers';

    public function __construct()
    {
        $this->name = __( 'Best Cashiers' );
        $this->description = __( 'Will display all cashiers who performs well.' );
        $this->permission = 'subul.see.best-cashier-widget';
    }
}
