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
      'ns_orders_code_type' => ns()->option->get('ns_orders_code_type'),
      'ns_orders_allow_unpaid' => ns()->option->get('ns_orders_allow_unpaid'),
      'ns_orders_allow_partial' => ns()->option->get('ns_orders_allow_partial'),
      'ns_orders_strict_instalments' => ns()->option->get('ns_orders_strict_instalments'),
      'ns_orders_quotation_expiration' => ns()->option->get('ns_orders_quotation_expiration'),
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
      'ns_orders_code_type' =>  Helper::kvToJsOptions([
        'date_sequential' => __('Sequential'),
        'random_code' => __('Random Code'),
        'number_sequential' => __('Number Sequential'),
      ]),
      'ns_orders_allow_unpaid' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_orders_allow_partial' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_orders_strict_instalments' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_orders_quotation_expiration' =>  $expirationOptions,
    ];
  }
}
