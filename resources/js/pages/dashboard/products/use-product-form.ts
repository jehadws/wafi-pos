/**
 * pages/dashboard/products/use-product-form.ts
 *
 * Shared hook for products create & edit.
 * The tab components (IdentificationTab, UnitsTab, etc.) already exist,
 * so this hook only needs to own form state, validation, and submit.
 */

import { defaultFormData, ProductFormData } from '@/components/forms/product-form/types';
import { useTranslation } from '@/lib/i18n';
import type { AppFormDataKeys } from '@/types/inertia-form';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export type ProductFormMode = 'create' | 'edit';

export interface EditProductData {
  id?: number;
  name?: string;
  expires?: boolean;
  on_expiration?: string;
  sub_items?: Array<{
    id?: number;
    product_id: number;
    unit_id: number | string;
    unit_quantity_id: number | string;
    quantity: number;
    sale_price: number;
    total_price?: number;
    name?: string;
    product?: {
      name?: string;
      unit_quantities?: UnitQuantity[];
    };
  }>;
  barcode?: string;
  barcode_type?: string;
  category_id?: number | null;
  description?: string | null;
  sku?: string;
  status?: 'available' | 'unavailable';
  stock_management?: 'enabled' | 'disabled' | boolean;
  type?: 'materialized' | 'dematerialized' | 'grouped';
  galleries?: Array<{ url: string }>;
  tax_group_id?: number | null;
  tax_type?: 'inclusive' | 'exclusive';
  accurate_tracking?: boolean;
  auto_cogs?: boolean;
  unit_group?: number;
  unit_quantities?: Array<{
    cogs: number;
    convert_unit_id: string;
    id?: number;
    low_quantity: number;
    preview_url: string;
    quantity: number;
    sale_price_edit: string;
    stock_alert_enabled: boolean;
    unit_id: string;
    visible: boolean;
    wholesale_price_edit: string;
  }>;
}

const editDefaults = (product: EditProductData): ProductFormData => ({
  name: product.name ?? '',
  expiracy_expires: product.expires ?? false,
  expiracy_on_expiration: product.on_expiration === 'allow_sales' ? 'allow_sales' : 'prevent_sales',
  groups_product_subitems: (product.sub_items ?? []).map((subItem) => ({
    id: subItem.id,
    product_id: subItem.product_id,
    unit_id: subItem.unit_id,
    unit_quantity_id: subItem.unit_quantity_id,
    quantity: subItem.quantity,
    sale_price: subItem.sale_price,
    total_price: subItem.total_price,
    name: subItem.product?.name ?? '',
    product: subItem.product ? { name: subItem.product.name, unit_quantities: subItem.product.unit_quantities ?? [] } : { unit_quantities: [] },
  })),
  identification_barcode: product.barcode ?? '',
  identification_barcode_type: product.barcode_type ?? '',
  identification_category_id: product.category_id ?? null,
  identification_description: product.description ?? '',
  identification_sku: product.sku ?? '',
  identification_status: product.status ?? 'available',
  identification_stock_management: product.stock_management === false || product.stock_management === 'disabled' ? 'disabled' : 'enabled',
  identification_type: product.type ?? 'materialized',
  /**
   * Hydrate the gallery URLs from the loaded `galleries` relation.
   * `ProductService::saveGallery` deletes then re-creates all rows on
   * every save — submitting `[]` would silently drop the images.
   */
  images: (product.galleries ?? []).map((gallery) => gallery.url),
  taxes_tax_group_id: product.tax_group_id ?? null,
  taxes_tax_type: product.tax_type ?? 'inclusive',
  units_accurate_tracking: product.accurate_tracking ?? false,
  units_auto_cogs: product.auto_cogs ?? false,
  units_unit_group: product.unit_group ?? 0,
  units_selling_group: (product?.unit_quantities ?? []).map((unit) => ({
    cogs: unit.cogs,
    convert_unit_id: unit.convert_unit_id,
    id: unit.id,
    low_quantity: unit.low_quantity,
    preview_url: unit.preview_url,
    quantity: unit.quantity,
    sale_price_edit: unit.sale_price_edit,
    stock_alert_enabled: unit.stock_alert_enabled,
    unit_id: unit.unit_id,
    visible: unit.visible,
    wholesale_price_edit: unit.wholesale_price_edit,
  })),
  identification_error: null,
  groups_error: null,
  images_error: null,
  units_error: null,
  taxes_error: null,
  expiracy_error: null,
});

const buildTransform = (data: ProductFormData) => ({
  name: data.name,
  variations: [
    {
      identification: {
        category_id: data.identification_category_id,
        barcode: data.identification_barcode,
        sku: data.identification_sku,
        barcode_type: data.identification_barcode_type,
        type: data.identification_type,
        status: data.identification_status,
        stock_management: data.identification_stock_management,
        description: data.identification_description,
      },
      groups: {
        product_subitems: data.groups_product_subitems.map((row) => ({
          id: row.id,
          product_id: row.product_id,
          unit_id: row.unit_id,
          unit_quantity_id: row.unit_quantity_id,
          quantity: row.quantity,
          sale_price: row.sale_price,
          total_price: row.total_price,
        })),
      },
      units: {
        unit_group: data.units_unit_group,
        accurate_tracking: data.units_accurate_tracking,
        auto_cogs: data.units_auto_cogs,
        selling_group: data.units_selling_group,
      },
      expiracy: {
        expires: data.expiracy_expires,
        on_expiration: data.expiracy_on_expiration,
      },
      taxes: {
        tax_group_id: data.taxes_tax_group_id,
        tax_type: data.taxes_tax_type,
      },
      images: data.images.map((url) => ({ url })),
      $primary: true,
    },
  ],
});

export function useProductForm(mode: ProductFormMode, product?: EditProductData) {
  const { t } = useTranslation();

  const form = useForm<ProductFormData>(mode === 'edit' && product ? editDefaults(product) : { ...defaultFormData });

  const handleInputChange = (name: keyof ProductFormData, value: string | number | number[] | boolean) => {
    form.setData({ ...form.data, [name]: value });
    if (form.errors[name]) form.clearErrors(name);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.name.trim()) {
      form.setError('name', t('Product name is required'));
      isValid = false;
    }
    if (!form.data.identification_category_id) {
      form.setError('identification_category_id', t('Category is required'));
      form.setError('identification_error', t('This field is required'));
      toast.error(t('Category is required'));
      isValid = false;
    }
    if (form.data.identification_type === 'grouped') {
      if (form.data.groups_product_subitems.length === 0) {
        form.setError('groups_error', t('A grouped product cannot be saved without any sub items.'));
        toast.error(t('A grouped product cannot be saved without any sub items.'));
        isValid = false;
      }
      if (form.data.groups_product_subitems.some((row) => !row.unit_quantity_id)) {
        form.setError('groups_error', t('Assign a unit to the product.'));
        toast.error(t('Assign a unit to the product.'));
        isValid = false;
      }
    }
    if (!form.data.units_unit_group) {
      form.setError('units_unit_group', t('Unit group is required'));
      form.setError('units_error', t('This field is required'));
      toast.error(t('Unit group is required'));
      isValid = false;
    }
    if (form.data.units_selling_group.length === 0) {
      form.setError('units_selling_group', t('At least one selling group is required'));
      form.setError('units_error', t('This field is required'));
      toast.error(t('At least one selling group is required'));
      isValid = false;
    } else {
      const unitIds = form.data.units_selling_group.map((g) => g.unit_id).filter(Boolean);
      if (unitIds.length !== new Set(unitIds).size) {
        form.setError('units_selling_group', t('Each unit can only be used once'));
        form.setError('units_error', t('Each unit can only be used once'));
        toast.error(t('Each unit can only be used once'));
        isValid = false;
      }
      form.data.units_selling_group.forEach((group, index) => {
        if (!group.unit_id) {
          form.setError(`units_selling_group.${index}.unit_id` as AppFormDataKeys<ProductFormData>, t('Unit is required'));
          form.setError('units_error', t('This field is required'));
          isValid = false;
        }
        if (group.unit_id && group.convert_unit_id && group.unit_id === group.convert_unit_id) {
          form.setError(`units_selling_group.${index}.convert_unit_id` as AppFormDataKeys<ProductFormData>, t('Unit cannot be same as convert unit'));
          form.setError('units_error', t('This field is required'));
          toast.error(t('Unit cannot be same as convert unit'));
          isValid = false;
        }
        if (group.quantity && isNaN(Number(group.quantity))) {
          form.setError(`units_selling_group.${index}.quantity` as AppFormDataKeys<ProductFormData>, t('Quantity must be a number'));
          form.setError('units_error', t('This field is required'));
          isValid = false;
        }
        if (group.low_quantity && isNaN(Number(group.low_quantity))) {
          form.setError(`units_selling_group.${index}.low_quantity` as AppFormDataKeys<ProductFormData>, t('Low quantity must be a number'));
          form.setError('units_error', t('This field is required'));
          isValid = false;
        }
      });
    }
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    form.transform(() => buildTransform(form.data));

    const onError = () => {
      toast.error(t('The form is not valid. Please check it and try again'));
    };

    if (mode === 'edit' && product) {
      form.put(`/api/products/${product.id}`, {
        preserveScroll: true,
        onError,
        onSuccess: () => toast.success(t('The entry has been successfully updated.')),
      });
    } else {
      form.post('/api/products', {
        preserveScroll: true,
        onError,
        onSuccess: () => toast.success(t('A new entry has been successfully created.')),
      });
    }
  };

  return { form, handleSubmit, handleInputChange };
}
