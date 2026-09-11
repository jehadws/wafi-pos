/**
 * services/order-quantities.ts
 *
 * Async helper for building product quantities from loaded orders.
 * Makes API calls to fetch tax groups.
 *
 * Extracted from order-builder.ts as part of CartEngine refactoring.
 */

import { taxesApi } from '@/api';
import { getVatValue } from '@/services/cart-engine';

/**
 * Builds a normalised quantities object for a product loaded from an order.
 * If the product has a tax group, the API is called to compute tax splits.
 *
 * @param product  - Raw order product (from API)
 * @param units    - Available units array (for resolving unit name)
 */
export async function defineQuantities(product: any, units: any[] = []): Promise<any> {
  const unit = units.filter((u) => u.id === product.unit_id);

  const quantities: any = {
    unit: unit[0] || {},
    sale_price_with_tax: product.mode === 'normal' ? parseFloat(product.price_with_tax) : 0,
    sale_price_without_tax: product.mode === 'normal' ? parseFloat(product.price_without_tax) : 0,
    sale_price: product.mode === 'normal' ? parseFloat(product.unit_price) : 0,
    sale_price_tax: product.mode === 'normal' ? product.tax_value : 0,
    sale_price_edit: 0,
    wholesale_price_with_tax: product.mode === 'wholesale' ? parseFloat(product.price_with_tax) : 0,
    wholesale_price_without_tax: product.mode === 'wholesale' ? parseFloat(product.price_without_tax) : 0,
    wholesale_price: product.mode === 'wholesale' ? parseFloat(product.unit_price) : 0,
    wholesale_price_tax: product.mode === 'wholesale' ? product.tax_value : 0,
    wholesale_price_edit: 0,
    custom_price_with_tax: product.mode === 'custom' ? parseFloat(product.price_with_tax) : 0,
    custom_price_without_tax: product.mode === 'custom' ? parseFloat(product.price_without_tax) : 0,
    custom_price: product.mode === 'custom' ? parseFloat(product.unit_price) : 0,
    custom_price_tax: product.mode === 'custom' ? product.tax_value : 0,
    custom_price_edit: product.mode === 'custom' ? parseFloat(product.unit_price) : 0,
  };

  if (['inclusive', 'exclusive'].includes(product.tax_type)) {
    if (product.tax_group_id) {
      const taxGroup = await taxesApi.getGroup(product.tax_group_id);
      ['sale', 'wholesale', 'custom'].forEach((label) => {
        quantities[label + '_price_tax'] = taxGroup.taxes
          .map((tax: any) => getVatValue(quantities[label + '_price'], tax.rate, product.tax_type))
          .reduce((b: number, a: number) => b + a, 0);
        quantities['gross_' + label + '_price'] = quantities[label + '_price'] + quantities[label + '_price_tax'];
        quantities['net_' + label + '_price'] = quantities[label + '_price'] - quantities[label + '_price_tax'];
      });
      return quantities;
    } else {
      quantities.sale_price_tax = 0;
      quantities.wholesale_price_tax = 0;
      quantities.sale_price_without_tax = product.unit_price;
      return quantities;
    }
  }

  return quantities;
}
