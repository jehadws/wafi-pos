import { OrderProduct } from '@/types/models/order-product';

export class CartCalculator {
  static calculateNewTaxValue(oldPriceWithoutTax: number, oldTaxValue: number, newPriceWithoutTax: number) {
    if (!oldPriceWithoutTax || oldPriceWithoutTax <= 0 || isNaN(oldPriceWithoutTax)) {
      return {
        taxRate: 0,
        newTaxValue: 0,
      };
    }

    const taxRate = oldTaxValue / oldPriceWithoutTax;
    const newTaxValue = newPriceWithoutTax * taxRate;

    return {
      taxRate: +(taxRate * 100).toFixed(2), // percent
      newTaxValue: +newTaxValue.toFixed(2), // rounded tax value
    };
  }

  static calculateTotalsForQuantityUpdate(product: OrderProduct, quantity: number, isPriceWithTax: boolean) {
    const lineSubtotal = product.unit_price * quantity;
    const discount_value =
      product.discount_type === 'percentage' ? ((product.discount_percentage || 0) / 100) * lineSubtotal : product.discount || 0;

    const totalBeforeTax = lineSubtotal - discount_value;

    let totalTaxValue = 0;
    const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    if (product.tax_type === 'exclusive') {
      totalTaxValue = totalBeforeTax * taxRate;
    } else if (product.tax_type === 'inclusive') {
      const taxMultiplier = 1 + taxRate;
      const priceWithTax = totalBeforeTax;
      const priceWithoutTax = taxMultiplier > 0 ? priceWithTax / taxMultiplier : priceWithTax;
      totalTaxValue = priceWithTax - priceWithoutTax;
    }

    const total_price_with_tax = totalBeforeTax + totalTaxValue;
    const total_price_without_tax = totalBeforeTax;

    return {
      discount: discount_value,
      quantity,
      total_tax_value: totalTaxValue,
      total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
      total_price_with_tax,
      total_price_without_tax,
    };
  }

  static calculateTotalsForPriceUpdate(product: OrderProduct, price: number, isPriceWithTax: boolean) {
    const discount_value = ((product.discount_percentage || 0) / 100) * price * product.quantity;
    const newTaxValue = this.calculateNewTaxValue(product.price_without_tax, product.tax_value, price).newTaxValue;
    const totalTaxValue = newTaxValue * product.quantity;
    const total_price = price * product.quantity;
    const total_price_with_tax = total_price + totalTaxValue - discount_value;
    const total_price_without_tax = total_price - discount_value;

    return {
      discount: discount_value,
      unit_price: price,
      price_without_tax: price,
      price_with_tax: price + newTaxValue,
      tax_value: newTaxValue,
      total_tax_value: totalTaxValue,
      mode: 'custom' as const,
      total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
      total_price_with_tax,
      total_price_without_tax,
    };
  }

  static calculateTotalsForDiscountPercentageUpdate(product: OrderProduct, discountPercentage: number, isPriceWithTax: boolean) {
    const lineSubtotal = (product.price_without_tax || product.unit_price) * product.quantity;
    const discount_value = (discountPercentage / 100) * lineSubtotal;
    const totalBeforeTax = lineSubtotal - discount_value;

    let totalTaxValue = 0;
    const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    if (product.tax_type === 'exclusive') {
      totalTaxValue = totalBeforeTax * taxRate;
    } else if (product.tax_type === 'inclusive') {
      const taxMultiplier = 1 + taxRate;
      const priceWithTax = (product.price_with_tax * product.quantity) - discount_value;
      const priceWithoutTax = taxMultiplier > 0 ? priceWithTax / taxMultiplier : priceWithTax;
      totalTaxValue = priceWithTax - priceWithoutTax;
    } else {
      totalTaxValue = (product.tax_value || 0) * product.quantity;
    }

    const total_price_with_tax = product.price_with_tax * product.quantity - discount_value;
    const total_price_without_tax = totalBeforeTax;

    return {
      discount_percentage: discountPercentage,
      discount: discount_value,
      total_tax_value: totalTaxValue,
      total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
      total_price_without_tax,
      total_price_with_tax,
    };
  }
}
