'use client';

/**
 * components/forms/product-form/groups-tab.tsx
 *
 * The "Groups" tab for grouped products — attaches sub products to the
 * current product. Rendered only when `identification_type === 'grouped'`
 * (parity with the backend `ProductCrud` groups tab).
 *
 * Row contract: `ProductService::saveSubItems` consumes
 * product_id/unit_id/unit_quantity_id/quantity/sale_price (+ id on edit).
 */

import { productsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { InertiaFormProps } from '@inertiajs/react';
import { Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import FormField from '../shared/form-field';
import type { ProductFormData, ProductSubItemRow } from './types';

interface GroupsTabProps {
  form: InertiaFormProps<ProductFormData>;
}

export default function GroupsTab({ form }: GroupsTabProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    setLoading(true);
    productsApi
      .getAll()
      .then((list) => setProducts((list ?? []).filter((product: Product) => product.type !== 'grouped')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = form.data.groups_product_subitems;

  const setRows = (newRows: ProductSubItemRow[]) => {
    form.setData({ ...form.data, groups_product_subitems: newRows });
    if (form.errors.groups_error) form.clearErrors('groups_error');
  };

  const updateRow = (index: number, patch: Partial<ProductSubItemRow>) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], ...patch };
    setRows(newRows);
  };

  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const addSubItem = async () => {
    const product = products.find((p) => p.id.toString() === selectedProductId);
    if (!product) return;
    setLoading(true);
    try {
      const unitQuantities = await productsApi.getUnitQuantities(product.id);
      const first = (unitQuantities ?? [])[0];
      const row: ProductSubItemRow = {
        product_id: product.id,
        unit_id: first?.unit_id ?? '',
        unit_quantity_id: first?.id ?? '',
        quantity: 1,
        sale_price: first?.sale_price ?? 0,
        name: product.name,
        product: { name: product.name, unit_quantities: unitQuantities ?? [] },
      };
      setRows([...rows, row]);
      setSelectedProductId('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {form.errors.groups_error && <p className="text-sm text-red-600">{form.errors.groups_error}</p>}

      <div className="flex items-end justify-between gap-4">
        <FormField label={t('Product')} htmlFor="groups_product_id" className="w-full">
          <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={loading}>
            <SelectTrigger className="w-full" id="groups_product_id">
              <SelectValue placeholder={t('Search products...')} />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id.toString()} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <Button type="button" onClick={addSubItem} variant="outline" size="sm" disabled={loading || !selectedProductId}>
          {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Plus className="me-2 h-4 w-4" />}
          {t('Add')}
        </Button>
      </div>

      {rows.map((row, index) => (
        <Card key={row.id ?? `${row.product_id}-${index}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{row.name || row.product?.name || t('Product')}</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField label={t('Assigned Unit')} required>
                <Select
                  value={row.unit_quantity_id.toString()}
                  onValueChange={(value) => {
                    const unitQuantity = row.product?.unit_quantities?.find((u) => u.id.toString() === value);
                    updateRow(index, {
                      unit_quantity_id: value,
                      unit_id: unitQuantity?.unit_id ?? row.unit_id,
                      sale_price: unitQuantity?.sale_price ?? row.sale_price,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('Choose...')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(row.product?.unit_quantities ?? []).map((unitQuantity) => (
                      <SelectItem key={unitQuantity.id.toString()} value={unitQuantity.id.toString()}>
                        {unitQuantity.unit?.name ?? `#${unitQuantity.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t('Quantity')} required>
                <Input type="number" value={row.quantity} onChange={(e) => updateRow(index, { quantity: +e.target.value })} placeholder="1" />
              </FormField>

              <FormField label={t('Sale Price')} required>
                <Input type="number" value={row.sale_price} onChange={(e) => updateRow(index, { sale_price: +e.target.value })} placeholder="10" />
              </FormField>
            </div>

            <p className="text-muted-foreground text-sm">
              {t('Total')}: {row.sale_price * row.quantity}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
