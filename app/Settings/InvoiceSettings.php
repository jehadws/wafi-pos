<?php

namespace App\Settings;

use App\Services\Helper;
use App\Services\SettingsPage;

class InvoiceSettings extends SettingsPage
{
  const IDENTIFIER = 'invoices';

  const VIEW = 'dashboard/settings/invoices';

  const AUTOLOAD = true;

  public function __construct()
  {
    $this->form = [
      'title' => __('Invoice Settings'),
      'description' => __('Configure how invoice and receipts are used.'),
      'tabs' => [
        'receipts' => include(dirname(__FILE__) . '/invoice-settings/receipts.php'),
      ],
    ];
  }

  public function getPayload()
  {
    return [
      'receipts' => [
        'sb_invoice_receipt_template' => sb()->option->get('sb_invoice_receipt_template'),
        'sb_invoice_receipt_logo' => sb()->option->get('sb_invoice_receipt_logo'),
        'sb_invoice_merge_similar_products' => sb()->option->get('sb_invoice_merge_similar_products'),
        'sb_invoice_display_tax_breakdown' => sb()->option->get('sb_invoice_display_tax_breakdown'),
        'sb_invoice_receipt_footer' => sb()->option->get('sb_invoice_receipt_footer'),
        'sb_invoice_receipt_column_a' => sb()->option->get('sb_invoice_receipt_column_a'),
        'sb_invoice_receipt_column_b' => sb()->option->get('sb_invoice_receipt_column_b'),
      ],
    ];
  }

  public function getOptions()
  {
    return [
      'sb_invoice_receipt_template' => Helper::kvToJsOptions([
        'default' => __('Default'),
      ]),
      'sb_invoice_merge_similar_products' => Helper::kvToJsOptions([
        'no' => __('No'),
        'yes' => __('Yes'),
      ]),
      'sb_invoice_display_tax_breakdown' => Helper::kvToJsOptions([
        'no' => __('No'),
        'yes' => __('Yes'),
      ]),
    ];
  }
}
