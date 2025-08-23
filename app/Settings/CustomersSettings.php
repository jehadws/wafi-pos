<?php

namespace App\Settings;

use App\Classes\SettingForm;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Services\Helper;
use App\Services\SettingsPage;

class CustomersSettings extends SettingsPage
{
  const IDENTIFIER = 'customers';

  const AUTOLOAD = true;
  const VIEW = 'dashboard/settings/customers';

  public function __construct()
  {
    $this->form = SettingForm::form(
      title: __('Customers Settings'),
      description: __('Configure the customers settings of the application.'),
      tabs: SettingForm::tabs(
        include dirname(__FILE__) . '/customers/general.php'
      )
    );
  }

  public function getPayload()
  {
    return [
      'ns_customers_rewards_enabled' => ns()->option->get('ns_customers_rewards_enabled', 'no'),
      'ns_customers_force_valid_email' => ns()->option->get('ns_customers_force_valid_email', 'no'),
      'ns_customers_force_unique_phone' => ns()->option->get('ns_customers_force_unique_phone', 'no'),
      'ns_customers_default' => ns()->option->get('ns_customers_default', 'no'),
      'ns_customers_default_group' => ns()->option->get('ns_customers_default_group', 'no'),
      'ns_customers_credit_enabled' => ns()->option->get('ns_customers_credit_enabled', 'no'),
    ];
  }

  public function getOptions()
  {
    return [
      'ns_customers_rewards_enabled' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_customers_force_valid_email' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_customers_force_unique_phone' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_customers_default' =>  Helper::toJsOptions(Customer::get(), ['id', ['first_name', 'last_name']]),
      'ns_customers_default_group' =>  Helper::toJsOptions(CustomerGroup::get(), ['id', 'name']),
      'ns_customers_credit_enabled' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
    ];
  }
}
