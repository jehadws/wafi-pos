<?php

namespace App\Widgets;

use App\Services\WidgetService;

class ExpenseCardWidget extends WidgetService
{
    protected $vueComponent = 'sbExpenseCardWidget';

    public function __construct()
    {
        $this->name = __( 'Expense Card Widget' );
        $this->description = __( 'Will display a card of current and overwall expenses.' );
        $this->permission = 'subul.see.expense-card-widget';
    }
}
