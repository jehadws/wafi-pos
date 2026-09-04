<?php

namespace App\Settings;

use App\Classes\SettingForm;
use App\Services\Helper;
use App\Services\SettingsPage;

class OrdersSettings extends SettingsPage
{
  const IDENTIFIER = 'orders';
  const VIEW = 'dashboard/settings/orders';
  const AUTOLOAD = true;

  public function __construct()
  {
    $this->form = SettingForm::form(
      title: __('Orders Settings'),
      description: __('configure settings that applies to orders.'),
      tabs: include(dirname(__FILE__) . '/orders/general.php')
    );
  }

  public function getPayload()
  {
    return [
      'sb_orders_code_type' => sb()->option->get('sb_orders_code_type'),
      'sb_orders_allow_unpaid' => sb()->option->get('sb_orders_allow_unpaid'),
      'sb_orders_allow_partial' => sb()->option->get('sb_orders_allow_partial'),
      'sb_orders_strict_instalments' => sb()->option->get('sb_orders_strict_instalments'),
      'sb_orders_quotation_expiration' => sb()->option->get('sb_orders_quotation_expiration'),
    ];
  }

  public function getOptions()
  {
    $options = collect([3, 5, 10, 15, 30])
      ->mapWithKeys(fn($days) => [$days => sprintf(__('%s Days'), $days)])
      ->toArray();

    $expirationOptions = Helper::kvToJsOptions($options);

    array_unshift($expirationOptions, [
      'value' => 'never',
      'label' => __('Never'),
    ]);

    return [
      'sb_orders_code_type' =>  Helper::kvToJsOptions([
        'date_sequential' => __('Sequential'),
        'random_code' => __('Random Code'),
        'number_sequential' => __('Number Sequential'),
      ]),
      'sb_orders_allow_unpaid' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'sb_orders_allow_partial' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'sb_orders_strict_instalments' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'sb_orders_quotation_expiration' =>  $expirationOptions,
    ];
  }
}
