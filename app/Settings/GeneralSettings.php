<?php

namespace App\Settings;

use App\Classes\FormInput;
use App\Classes\Hook;
use App\Classes\SettingForm;
use App\Models\Role;
use App\Services\Helper;
use App\Services\SettingsPage;

class GeneralSettings extends SettingsPage
{
  const IDENTIFIER = 'general';

  const AUTOLOAD = true;
  const VIEW = 'dashboard/settings/general';

  public function __construct()
  {
    $this->form = SettingForm::form(
      title: __('General Settings'),
      description: __('Configure the general settings of the application.'),
      tabs: SettingForm::tabs(
        $this->getIdentificationSettings(),
        $this->getCurrencySettings(),
        $this->getDateSettings(),
        $this->getRegistrationSettings(),
      )
    );
  }

  public function getIdentificationSettings()
  {
    return SettingForm::tab(
      label: __('Identification'),
      identifier: 'identification',
      fields: SettingForm::fields(
        FormInput::text(
          name: 'sb_store_name',
          value: sb()->option->get('sb_store_name'),
          label: __('Store Name'),
          description: __('This is the store name.'),
          validation: 'required',
        ),
        FormInput::text(
          name: 'sb_store_address',
          value: sb()->option->get('sb_store_address'),
          label: __('Store Address'),
          description: __('The actual store address.'),
        ),
        FormInput::text(
          name: 'sb_store_city',
          value: sb()->option->get('sb_store_city'),
          label: __('Store City'),
          description: __('The actual store city.'),
        ),
        FormInput::text(
          name: 'sb_store_phone',
          value: sb()->option->get('sb_store_phone'),
          label: __('Store Phone'),
          description: __('The phone number to reach the store.'),
        ),
        FormInput::text(
          name: 'sb_store_email',
          value: sb()->option->get('sb_store_email'),
          label: __('Store Email'),
          description: __('The actual store email. Might be used on invoice or for reports.'),
        ),
        FormInput::text(
          name: 'sb_store_pobox',
          value: sb()->option->get('sb_store_pobox'),
          label: __('Store PO.Box'),
          description: __('The store mail box number.'),
        ),
        FormInput::text(
          name: 'sb_store_fax',
          value: sb()->option->get('sb_store_fax'),
          label: __('Store Fax'),
          description: __('The store fax number.'),
        ),
        FormInput::textarea(
          name: 'sb_store_additional',
          value: sb()->option->get('sb_store_additional'),
          label: __('Store Additional Information'),
          description: __('Store additional information.'),
        ),
        FormInput::media(
          name: 'sb_store_square_logo',
          value: sb()->option->get('sb_store_square_logo'),
          label: __('Store Square Logo'),
          description: __('Choose what is the square logo of the store.'),
        ),
        FormInput::media(
          name: 'sb_store_rectangle_logo',
          value: sb()->option->get('sb_store_rectangle_logo'),
          label: __('Store Rectangle Logo'),
          description: __('Choose what is the rectangle logo of the store.'),
        ),
        FormInput::select(
          name: 'sb_store_language',
          value: sb()->option->get('sb_store_language'),
          options: Helper::kvToJsOptions(config('subul.languages')),
          label: __('Language'),
          description: __('Define the default fallback language.'),
        ),
        FormInput::select(
          name: 'sb_default_theme',
          value: sb()->option->get('sb_default_theme'),
          options: Helper::kvToJsOptions([
            'dark' => __('Dark'),
            'light' => __('Light'),
          ]),
          label: __('Theme'),
          description: __('Define the default theme.'),
        ),
      )
    );
  }

  public function getCurrencySettings()
  {
    return SettingForm::tab(
      label: __('Currency'),
      identifier: 'currency',
      fields: SettingForm::fields(
        FormInput::text(
          name: 'sb_currency_symbol',
          value: sb()->option->get('sb_currency_symbol'),
          label: __('Currency Symbol'),
          description: __('This is the currency symbol.'),
          validation: 'required',
        ),
        FormInput::text(
          name: 'sb_currency_iso',
          value: sb()->option->get('sb_currency_iso'),
          label: __('Currency ISO'),
          description: __('The international currency ISO format.'),
          validation: 'required',
        ),
        FormInput::select(
          name: 'sb_currency_position',
          value: sb()->option->get('sb_currency_position'),
          options: [
            [
              'label' => __('Before the amount'),
              'value' => 'before',
            ],
            [
              'label' => __('After the amount'),
              'value' => 'after',
            ],
          ],
          label: __('Currency Position'),
          description: __('Define where the currency should be located.'),
        ),
        FormInput::select(
          name: 'sb_currency_prefered',
          value: sb()->option->get('sb_currency_prefered'),
          options: [
            [
              'label' => __('ISO Currency'),
              'value' => 'iso',
            ],
            [
              'label' => __('Symbol'),
              'value' => 'symbol',
            ],
          ],
          label: __('Preferred Currency'),
          description: __('Determine what is the currency indicator that should be used.'),
        ),
        FormInput::text(
          name: 'sb_currency_thousand_separator',
          value: sb()->option->get('sb_currency_thousand_separator'),
          label: __('Currency Thousand Separator'),
          description: __('Define the symbol that indicate thousand. By default "," is used.'),
        ),
        FormInput::text(
          name: 'sb_currency_decimal_separator',
          value: sb()->option->get('sb_currency_decimal_separator'),
          label: __('Currency Decimal Separator'),
          description: __('Define the symbol that indicate decimal number. By default "." is used.'),
        ),
        FormInput::select(
          name: 'sb_currency_precision',
          value: sb()->option->get('sb_currency_precision', '2'),
          options: collect([0, 1, 2, 3, 4, 5])->map(function ($index) {
            return [
              'label' => sprintf(__('%s numbers after the decimal'), $index),
              'value' => $index,
            ];
          })->toArray(),
          label: __('Currency Precision'),
          description: __('Define where the currency should be located.'),
        ),
      )
    );
  }

  public function getDateSettings()
  {
    return SettingForm::tab(
      label: __('Date'),
      identifier: 'date',
      fields: SettingForm::fields(
        FormInput::select(
          label: __('Date Format'),
          name: 'sb_date_format',
          value: sb()->option->get('sb_date_format'),
          options: Helper::kvToJsOptions([
            'Y-m-d' => sb()->date->format('Y-m-d'),
            'Y/m/d' => sb()->date->format('Y/m/d'),
            'd-m-y' => sb()->date->format('d-m-Y'),
            'd/m/y' => sb()->date->format('d/m/Y'),
            'M dS, Y' => sb()->date->format('M dS, Y'),
            'd M Y' => sb()->date->format('d M Y'),
            'd.m.Y' => sb()->date->format('d.m.Y'),
          ]),
          description: __('This define how the date should be defined. The default format is "Y-m-d".'),
        ),
        FormInput::select(
          label: __('Date Time Format'),
          name: 'sb_datetime_format',
          value: sb()->option->get('sb_datetime_format'),
          options: Helper::kvToJsOptions([
            'Y-m-d H:i' => sb()->date->format('Y-m-d H:i'),
            'Y/m/d H:i' => sb()->date->format('Y/m/d H:i'),
            'd-m-y H:i' => sb()->date->format('d-m-Y H:i'),
            'd/m/y H:i' => sb()->date->format('d/m/Y H:i'),
            'M dS, Y H:i' => sb()->date->format('M dS, Y H:i'),
            'd M Y, H:i' => sb()->date->format('d M Y, H:i'),
            'd.m.Y, H:i' => sb()->date->format('d.m.Y, H:i'),
          ]),
          description: __('This define how the date and times hould be formated. The default format is "Y-m-d H:i".'),
        ),
        FormInput::select(
          label: sprintf(__('Date TimeZone')),
          name: 'sb_datetime_timezone',
          value: sb()->option->get('sb_datetime_timezone'),
          type: 'search-select',
          options: Helper::kvToJsOptions(config('subul.timezones')),
          description: sprintf(__('Determine the default timezone of the store. Current Time: %s'), sb()->date->getNowFormatted()),
        ),
      )
    );
  }

  public function getRegistrationSettings()
  {
    return SettingForm::tab(
      label: __('Registration'),
      identifier: 'registration',
      fields: SettingForm::fields(
        FormInput::select(
          name: 'sb_registration_enabled',
          value: sb()->option->get('sb_registration_enabled'),
          options: Helper::kvToJsOptions([
            'yes' => __('Yes'),
            'no' => __('No'),
          ]),
          label: __('Registration Open'),
          description: __('Determine if everyone can register.'),
        ),
        FormInput::select(
          name: 'sb_registration_role',
          value: sb()->option->get('sb_registration_role'),
          options: Helper::toJsOptions(Hook::filter('sb-registration-roles', Role::get()), ['id', 'name']),
          label: __('Registration Role'),
          description: __('Select what is the registration role.'),
        ),
        FormInput::select(
          name: 'sb_registration_validated',
          value: sb()->option->get('sb_registration_validated'),
          options: Helper::kvToJsOptions([
            'yes' => __('Yes'),
            'no' => __('No'),
          ]),
          label: __('Requires Validation'),
          description: __('Force account validation after the registration.'),
        ),
        FormInput::switch(
          name: 'sb_recovery_enabled',
          value: sb()->option->get('sb_recovery_enabled'),
          options: Helper::kvToJsOptions([
            'yes' => __('Yes'),
            'no' => __('No'),
          ]),
          label: __('Allow Recovery'),
          description: __('Allow any user to recover his account.'),
        ),
      )
    );
  }

  public function getPayload()
  {
    return [
      'identification' => [
        'sb_store_name' => sb()->option->get('sb_store_name'),
        'sb_store_address' => sb()->option->get('sb_store_address'),
        'sb_store_city' => sb()->option->get('sb_store_city'),
        'sb_store_phone' => sb()->option->get('sb_store_phone'),
        'sb_store_email' => sb()->option->get('sb_store_email'),
        'sb_store_pobox' => sb()->option->get('sb_store_pobox'),
        'sb_store_fax' => sb()->option->get('sb_store_fax'),
        'sb_store_additional' => sb()->option->get('sb_store_additional'),
        'sb_store_square_logo' => sb()->option->get('sb_store_square_logo'),
        'sb_store_rectangle_logo' => sb()->option->get('sb_store_rectangle_logo'),
        'sb_store_language' => sb()->option->get('sb_store_language'),
        'sb_default_theme' => sb()->option->get('sb_default_theme'),
      ],
      'currency' => [
        'sb_currency_symbol' => sb()->option->get('sb_currency_symbol'),
        'sb_currency_iso' => sb()->option->get('sb_currency_iso'),
        'sb_currency_position' => sb()->option->get('sb_currency_position'),
        'sb_currency_prefered' => sb()->option->get('sb_currency_prefered'),
        'sb_currency_thousand_separator' => sb()->option->get('sb_currency_thousand_separator'),
        'sb_currency_decimal_separator' => sb()->option->get('sb_currency_decimal_separator'),
        'sb_currency_precision' => sb()->option->get('sb_currency_precision'),
      ],
      'date' => [
        'sb_date_format' => sb()->option->get('sb_date_format'),
        'sb_datetime_format' => sb()->option->get('sb_datetime_format'),
        'sb_datetime_timezone' => sb()->option->get('sb_datetime_timezone'),
      ],
      'registration' => [
        'sb_registration_enabled' => sb()->option->get('sb_registration_enabled'),
        'sb_registration_role' => sb()->option->get('sb_registration_role'),
        'sb_registration_validated' => sb()->option->get('sb_registration_validated'),
        'sb_recovery_enabled' => sb()->option->get('sb_recovery_enabled'),
      ],
    ];
  }

  public function getOptions()
  {
    return [
      'sb_store_language' => Helper::kvToJsOptions(config('subul.languages')),
      'sb_default_theme' => Helper::kvToJsOptions([
        'dark' => __('Dark'),
        'light' => __('Light'),
      ]),
      'sb_currency_position' => [
        [
          'label' => __('Before the amount'),
          'value' => 'before',
        ],
        [
          'label' => __('After the amount'),
          'value' => 'after',
        ],
      ],
      'sb_currency_prefered' => [
        [
          'label' => __('ISO Currency'),
          'value' => 'iso',
        ],
        [
          'label' => __('Symbol'),
          'value' => 'symbol',
        ],
      ],
      'sb_currency_precision' =>  collect([0, 1, 2, 3, 4, 5])->map(function ($index) {
        return [
          'label' => sprintf(__('%s numbers after the decimal'), $index),
          'value' => $index,
        ];
      })->toArray(),
      'sb_date_format' => Helper::kvToJsOptions([
        'Y-m-d' => sb()->date->format('Y-m-d'),
        'Y/m/d' => sb()->date->format('Y/m/d'),
        'd-m-y' => sb()->date->format('d-m-Y'),
        'd/m/y' => sb()->date->format('d/m/Y'),
        'M dS, Y' => sb()->date->format('M dS, Y'),
        'd M Y' => sb()->date->format('d M Y'),
        'd.m.Y' => sb()->date->format('d.m.Y'),
      ]),
      'sb_datetime_format' => Helper::kvToJsOptions([
        'Y-m-d H:i' => sb()->date->format('Y-m-d H:i'),
        'Y/m/d H:i' => sb()->date->format('Y/m/d H:i'),
        'd-m-y H:i' => sb()->date->format('d-m-Y H:i'),
        'd/m/y H:i' => sb()->date->format('d/m/Y H:i'),
        'M dS, Y H:i' => sb()->date->format('M dS, Y H:i'),
        'd M Y, H:i' => sb()->date->format('d M Y, H:i'),
        'd.m.Y, H:i' => sb()->date->format('d.m.Y, H:i'),
      ]),
      'sb_datetime_timezone' => Helper::kvToJsOptions(config('subul.timezones')),
      'sb_registration_enabled' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'sb_registration_role' => Helper::toJsOptions(Hook::filter('sb-registration-roles', Role::get()), ['id', 'name']),
      'sb_registration_validated' =>  Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
    ];
  }
}
