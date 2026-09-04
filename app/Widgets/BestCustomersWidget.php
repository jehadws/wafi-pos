<?php

namespace App\Widgets;

use App\Services\WidgetService;

class BestCustomersWidget extends WidgetService
{
    protected $vueComponent = 'sbBestCustomers';

    public function __construct()
    {
        $this->name = __( 'Best Customers' );
        $this->description = __( 'Will display all customers with the highest purchases.' );
        $this->permission = 'subul.see.best-customers-widget';
    }
}
