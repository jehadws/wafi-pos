<?php

namespace App\Settings;

use App\Services\Helper;
use App\Services\Options;
use App\Services\SettingsPage;

class WorkersSettings extends SettingsPage
{
  const IDENTIFIER = 'workers';
  const VIEW = 'dashboard/settings/workers';
  const AUTOLOAD = true;

  public function __construct()
  {
    $options = app()->make(Options::class);

    $this->form = [
      'title' => __('Workers Settings'),
      'description' => __('Configure how background operations works.'),
      'tabs' => [
        'general' => include(dirname(__FILE__) . '/workers/general.php'),
      ],
    ];
  }


  public function getPayload()
  {
    return [
      'sb_workers_enabled' => sb()->option->get('sb_workers_enabled', 'no'),
    ];
  }

  public function getOptions()
  {
    return [
      'sb_workers_enabled' =>  collect(Helper::kvToJsOptions([
        'no' => __('No'),
        'await_confirm' => __('Test'),
        'yes' => __('Yes'),
      ]))->map(function ($option) {
        $option['disabled'] = false;
        if ($option['value'] === 'yes') {
          $option['disabled'] = true;
        }

        return $option;
      }),
    ];
  }
}
