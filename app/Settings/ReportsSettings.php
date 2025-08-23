<?php

namespace App\Settings;

use App\Services\Helper;
use App\Services\SettingsPage;

class ReportsSettings extends SettingsPage
{
  const IDENTIFIER = 'reports';
  const VIEW = 'dashboard/settings/reports';
  const AUTOLOAD = true;

  public function __construct()
  {
    $this->form = [
      'title' => __('Report Settings'),
      'description' => __('Configure the settings'),
      'tabs' => [
        'general' => include(dirname(__FILE__) . '/reports/general.php'),
      ],
    ];
  }

  public function getPayload()
  {
    return [
      'ns_reports_email' => ns()->option->get('ns_reports_email'),
    ];
  }

  public function getOptions()
  {
    return [
      'ns_reports_email' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
    ];
  }
}
