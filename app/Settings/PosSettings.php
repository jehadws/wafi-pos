<?php

namespace App\Settings;

use App\Classes\Hook;
use App\Models\PaymentType;
use App\Models\TaxGroup;
use App\Models\Unit;
use App\Services\Helper;
use App\Services\OrdersService;
use App\Services\SettingsPage;

class PosSettings extends SettingsPage
{
  const IDENTIFIER = 'pos';
  const VIEW = 'dashboard/settings/pos';
  const AUTOLOAD = true;

  public $form;

  public function __construct()
  {
    $posSettingsTabs = Hook::filter('ns-pos-settings-tabs', [
      'layout' => include(dirname(__FILE__) . '/pos/layout.php'),
      'printing' => include(dirname(__FILE__) . '/pos/printing.php'),
      'registers' => include(dirname(__FILE__) . '/pos/registers.php'),
      'vat' => include(dirname(__FILE__) . '/pos/vat.php'),
      'shortcuts' => include(dirname(__FILE__) . '/pos/shortcuts.php'),
      'features' => include(dirname(__FILE__) . '/pos/features.php'),
    ]);

    $this->form = [
      'tabs' => $posSettingsTabs,
      'title' => __('POS Settings'),
      'description' => __('Configure the pos settings.'),
    ];
  }

  public function getPayload()
  {
    return [
      'layout' => [
        'ns_jgrem_layout' => ns()->option->get('ns_jgrem_layout'),
        'ns_jgrem_complete_sale_audio' => ns()->option->get('ns_jgrem_complete_sale_audio'),
        'ns_jgrem_new_item_audio' => ns()->option->get('ns_jgrem_new_item_audio'),
      ],
      'printing' => [
        'ns_jgrem_printing_document' => ns()->option->get('ns_jgrem_printing_document'),
        'ns_jgrem_printing_enabled_for' => ns()->option->get('ns_jgrem_printing_enabled_for'),
        'ns_jgrem_printing_gateway' => ns()->option->get('ns_jgrem_printing_gateway'),
        'ns_jgrem_printing_auto' => ns()->option->get('ns_jgrem_printing_auto'),
      ],
      'registers' => [
        'ns_jgrem_registers_enabled' => ns()->option->get('ns_jgrem_registers_enabled'),
        'ns_jgrem_idle_counter' => ns()->option->get('ns_jgrem_idle_counter'),
        'ns_jgrem_disbursement' => ns()->option->get('ns_jgrem_disbursement'),
        'ns_jgrem_registers_default_change_payment_type' => ns()->option->get('ns_jgrem_registers_default_change_payment_type'),
      ],
      'vat' => [
        'ns_jgrem_vat' => ns()->option->get('ns_jgrem_vat'),
        'ns_jgrem_tax_group' => ns()->option->get('ns_jgrem_tax_group'),
        'ns_jgrem_tax_type' => ns()->option->get('ns_jgrem_tax_type'),
      ],
      'shortcuts' => [
        'ns_jgrem_keyboard_cancel_order' => ns()->option->get('ns_jgrem_keyboard_cancel_order', []),
        'ns_jgrem_keyboard_hold_order' => ns()->option->get('ns_jgrem_keyboard_hold_order', []),
        'ns_jgrem_keyboard_create_customer' => ns()->option->get('ns_jgrem_keyboard_create_customer', []),
        'ns_jgrem_keyboard_payment' => ns()->option->get('ns_jgrem_keyboard_payment', []),
        'ns_jgrem_keyboard_shipping' => ns()->option->get('ns_jgrem_keyboard_shipping', []),
        'ns_jgrem_keyboard_note' => ns()->option->get('ns_jgrem_keyboard_note', []),
        'ns_jgrem_keyboard_order_type' => ns()->option->get('ns_jgrem_keyboard_order_type', []),
        'ns_jgrem_keyboard_fullscreen' => ns()->option->get('ns_jgrem_keyboard_fullscreen', []),
        'ns_jgrem_keyboard_quick_search' => ns()->option->get('ns_jgrem_keyboard_quick_search', []),
        'ns_jgrem_keyboard_toggle_merge' => ns()->option->get('ns_jgrem_keyboard_toggle_merge', []),
        'ns_jgrem_amount_shortcut' => ns()->option->get('ns_jgrem_amount_shortcut'),
      ],
      'features' => [
        'ns_jgrem_show_quantity' => ns()->option->get('ns_jgrem_show_quantity'),
        'ns_jgrem_items_merge' => ns()->option->get('ns_jgrem_items_merge'),
        'ns_jgrem_allow_wholesale_price' => ns()->option->get('ns_jgrem_allow_wholesale_price'),
        'ns_jgrem_allow_decimal_quantities' => ns()->option->get('ns_jgrem_allow_decimal_quantities'),
        'ns_jgrem_quick_product' => ns()->option->get('ns_jgrem_quick_product'),
        'ns_jgrem_quick_product_default_unit' => ns()->option->get('ns_jgrem_quick_product_default_unit'),
        'ns_jgrem_unit_price_ediable' => ns()->option->get('ns_jgrem_unit_price_ediable'),
        'ns_jgrem_price_with_tax' => ns()->option->get('ns_jgrem_price_with_tax'),
        'ns_jgrem_order_types' => ns()->option->get('ns_jgrem_order_types'),
        'ns_jgrem_numpad' => ns()->option->get('ns_jgrem_numpad'),
        'ns_jgrem_force_autofocus' => ns()->option->get('ns_jgrem_force_autofocus'),
        'ns_jgrem_hide_exhausted_products' => ns()->option->get('ns_jgrem_hide_exhausted_products'),
        'ns_jgrem_hide_empty_categories' => ns()->option->get('ns_jgrem_hide_empty_categories'),
      ],
    ];
  }

  public function getOptions()
  {
    $audios = Helper::kvToJsOptions([
      'disabled' => __('Disabled'),
      url('/audio/bubble.mp3') => __('Bubble'),
      url('/audio/ding.mp3') => __('Ding'),
      url('/audio/pop.mp3') => __('Pop'),
      url('/audio/cash-sound.mp3') => __('Cash Sound'),
    ]);

    $shortcuts = [
      [
        'label' => 'backspace',
        'value' => 'backspace',
      ],
      [
        'label' => 'tab',
        'value' => 'tab',
      ],
      [
        'label' => 'enter',
        'value' => 'enter',
      ],
      [
        'label' => 'shift',
        'value' => 'shift',
      ],
      [
        'label' => 'ctrl',
        'value' => 'ctrl',
      ],
      [
        'label' => 'alt',
        'value' => 'alt',
      ],
      [
        'label' => 'pause',
        'value' => 'pause',
      ],
      [
        'label' => 'capital',
        'value' => 'capital',
      ],
      [
        'label' => 'escape',
        'value' => 'escape',
      ],
      [
        'label' => 'pageup',
        'value' => 'pageup',
      ],
      [
        'label' => 'pagedown',
        'value' => 'pagedown',
      ],
      [
        'label' => 'end',
        'value' => 'end',
      ],
      [
        'label' => 'home',
        'value' => 'home',
      ],
      [
        'label' => 'left',
        'value' => 'left',
      ],
      [
        'label' => 'up',
        'value' => 'up',
      ],
      [
        'label' => 'right',
        'value' => 'right',
      ],
      [
        'label' => 'down',
        'value' => 'down',
      ],
      [
        'label' => 'insert',
        'value' => 'insert',
      ],
      [
        'label' => 'delete',
        'value' => 'delete',
      ],
      [
        'label' => '0',
        'value' => '0',
      ],
      [
        'label' => '1',
        'value' => '1',
      ],
      [
        'label' => '2',
        'value' => '2',
      ],
      [
        'label' => '3',
        'value' => '3',
      ],
      [
        'label' => '4',
        'value' => '4',
      ],
      [
        'label' => '5',
        'value' => '5',
      ],
      [
        'label' => '6',
        'value' => '6',
      ],
      [
        'label' => '7',
        'value' => '7',
      ],
      [
        'label' => '8',
        'value' => '8',
      ],
      [
        'label' => '9',
        'value' => '9',
      ],
      [
        'label' => 'a',
        'value' => 'a',
      ],
      [
        'label' => 'b',
        'value' => 'b',
      ],
      [
        'label' => 'c',
        'value' => 'c',
      ],
      [
        'label' => 'd',
        'value' => 'd',
      ],
      [
        'label' => 'e',
        'value' => 'e',
      ],
      [
        'label' => 'f',
        'value' => 'f',
      ],
      [
        'label' => 'g',
        'value' => 'g',
      ],
      [
        'label' => 'h',
        'value' => 'h',
      ],
      [
        'label' => 'i',
        'value' => 'i',
      ],
      [
        'label' => 'j',
        'value' => 'j',
      ],
      [
        'label' => 'k',
        'value' => 'k',
      ],
      [
        'label' => 'l',
        'value' => 'l',
      ],
      [
        'label' => 'm',
        'value' => 'm',
      ],
      [
        'label' => 'n',
        'value' => 'n',
      ],
      [
        'label' => 'o',
        'value' => 'o',
      ],
      [
        'label' => 'p',
        'value' => 'p',
      ],
      [
        'label' => 'q',
        'value' => 'q',
      ],
      [
        'label' => 'r',
        'value' => 'r',
      ],
      [
        'label' => 's',
        'value' => 's',
      ],
      [
        'label' => 't',
        'value' => 't',
      ],
      [
        'label' => 'u',
        'value' => 'u',
      ],
      [
        'label' => 'v',
        'value' => 'v',
      ],
      [
        'label' => 'w',
        'value' => 'w',
      ],
      [
        'label' => 'x',
        'value' => 'x',
      ],
      [
        'label' => 'y',
        'value' => 'y',
      ],
      [
        'label' => 'z',
        'value' => 'z',
      ],
      [
        'label' => 'num_0',
        'value' => 'num_0',
      ],
      [
        'label' => 'num_1',
        'value' => 'num_1',
      ],
      [
        'label' => 'num_2',
        'value' => 'num_2',
      ],
      [
        'label' => 'num_3',
        'value' => 'num_3',
      ],
      [
        'label' => 'num_4',
        'value' => 'num_4',
      ],
      [
        'label' => 'num_5',
        'value' => 'num_5',
      ],
      [
        'label' => 'num_6',
        'value' => 'num_6',
      ],
      [
        'label' => 'num_7',
        'value' => 'num_7',
      ],
      [
        'label' => 'num_8',
        'value' => 'num_8',
      ],
      [
        'label' => 'num_9',
        'value' => 'num_9',
      ],
      [
        'label' => 'num_multiply',
        'value' => 'num_multiply',
      ],
      [
        'label' => 'num_add',
        'value' => 'num_add',
      ],
      [
        'label' => 'num_enter',
        'value' => 'num_enter',
      ],
      [
        'label' => 'num_subtract',
        'value' => 'num_subtract',
      ],
      [
        'label' => 'num_decimal',
        'value' => 'num_decimal',
      ],
      [
        'label' => 'num_divide',
        'value' => 'num_divide',
      ],
      [
        'label' => '⌘',
        'value' => '⌘',
      ],
      [
        'label' => 'f1',
        'value' => 'f1',
      ],
      [
        'label' => 'f2',
        'value' => 'f2',
      ],
      [
        'label' => 'f3',
        'value' => 'f3',
      ],
      [
        'label' => 'f4',
        'value' => 'f4',
      ],
      [
        'label' => 'f5',
        'value' => 'f5',
      ],
      [
        'label' => 'f6',
        'value' => 'f6',
      ],
      [
        'label' => 'f7',
        'value' => 'f7',
      ],
      [
        'label' => 'f8',
        'value' => 'f8',
      ],
      [
        'label' => 'f9',
        'value' => 'f9',
      ],
      [
        'label' => 'f10',
        'value' => 'f10',
      ],
      [
        'label' => 'f11',
        'value' => 'f11',
      ],
      [
        'label' => 'f12',
        'value' => 'f12',
      ],
    ];

    return [
      'ns_jgrem_layout' => Helper::kvToJsOptions([
        'grocery_shop' => __('Retail Layout'),
        'clothing_shop' => __('Clothing Shop'),
      ]),
      'ns_jgrem_complete_sale_audio' => $audios,
      'ns_jgrem_new_item_audio' => $audios,
      'ns_jgrem_printing_document' => Helper::kvToJsOptions([
        'invoice' => __('Invoice'),
        'receipt' => __('Receipt'),
      ]),
      'ns_jgrem_printing_enabled_for' => Helper::kvToJsOptions([
        'disabled' => __('Disabled'),
        'all_orders' => __('All Orders'),
        'partially_paid_orders' => __('From Partially Paid Orders'),
        'only_paid_orders' => __('Only Paid Orders'),
      ]),
      'ns_jgrem_printing_gateway' => Helper::kvToJsOptions([
        'default' => __('Default Printing (web)'),
      ]),
      'ns_jgrem_printing_auto' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_registers_enabled' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_idle_counter' => Helper::kvToJsOptions([
        'disabled' => __('Disabled'),
        '5min' => __('5 Minutes'),
        '10min' => __('10 Minutes'),
        '15min' => __('15 Minutes'),
        '20min' => __('20 Minutes'),
        '30min' => __('30 Minutes'),
      ]),
      'ns_jgrem_disbursement' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_registers_default_change_payment_type' => Helper::toJsOptions(PaymentType::get(['id', 'label']), ['id', 'label']),
      'ns_jgrem_vat' => Helper::kvToJsOptions([
        'disabled' => __('Disabled'),
        'flat_vat' => __('Flat Rate'),
        'variable_vat' => __('Flexible Rate'),
        'products_vat' => __('Products Vat'),
      ]),
      'ns_jgrem_tax_group' => Helper::toJsOptions(TaxGroup::get(), ['id', 'name']),
      'ns_jgrem_tax_type' => Helper::kvToJsOptions([
        'inclusive' => __('Inclusive'),
        'exclusive' => __('Exclusive'),
      ]),
      'ns_jgrem_keyboard_shortcuts' => $shortcuts,
      'ns_jgrem_show_quantity' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_items_merge' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_allow_wholesale_price' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_allow_decimal_quantities' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_quick_product' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_quick_product_default_unit' => Helper::toJsOptions(Unit::get(), ['id', 'name']),
      'ns_jgrem_unit_price_ediable' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_price_with_tax' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_order_types' => Helper::kvToJsOptions(app()->make(OrdersService::class)->getTypeLabels()),
      'ns_jgrem_numpad' => Helper::kvToJsOptions([
        'default' => __('Default'),
        'advanced' => __('Advanced'),
      ]),
      'ns_jgrem_force_autofocus' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_hide_exhausted_products' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
      'ns_jgrem_hide_empty_categories' => Helper::kvToJsOptions([
        'yes' => __('Yes'),
        'no' => __('No'),
      ]),
    ];
  }
}
