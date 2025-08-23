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
        'ns_invoice_receipt_template' => ns()->option->get('ns_invoice_receipt_template'),
        'ns_invoice_receipt_logo' => ns()->option->get('ns_invoice_receipt_logo'),
        'ns_invoice_merge_similar_products' => ns()->option->get('ns_invoice_merge_similar_products'),
        'ns_invoice_display_tax_breakdown' => ns()->option->get('ns_invoice_display_tax_breakdown'),
        'ns_invoice_receipt_footer' => ns()->option->get('ns_invoice_receipt_footer'),
        'ns_invoice_receipt_column_a' => ns()->option->get('ns_invoice_receipt_column_a'),
        'ns_invoice_receipt_column_b' => ns()->option->get('ns_invoice_receipt_column_b'),
      ],
    ];
  }

  public function getOptions()
  {
    return [
      'ns_invoice_receipt_template' => Helper::kvToJsOptions([
        'default' => __('Default'),
      ]),
      'ns_invoice_merge_similar_products' => Helper::kvToJsOptions([
        'no' => __('No'),
        'yes' => __('Yes'),
      ]),
      'ns_invoice_display_tax_breakdown' => Helper::kvToJsOptions([
        'no' => __('No'),
        'yes' => __('Yes'),
      ]),
    ];
  }
}
