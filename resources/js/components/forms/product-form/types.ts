import { InertiaFormProps } from '@inertiajs/react';

export type Tab = 'identification' | 'groups' | 'images' | 'units' | 'taxes' | 'expiracy';

/**
 * A sub item attached to a grouped product.
 *
 * Submitted rows must carry the keys consumed by `ProductService::saveSubItems`
 * (id?/product_id/unit_id/unit_quantity_id/quantity/sale_price — `total_price`
 * is computed server-side when absent). `name`/`product` are display-only
 * extras the server ignores.
 */
export type ProductSubItemRow = {
  id?: number;
  product_id: number;
  unit_id: number | string;
  unit_quantity_id: number | string;
  quantity: number;
  sale_price: number;
  total_price?: number;
  name?: string;
  product?: { name?: string; unit_quantities?: UnitQuantity[] };
};

export type ProductFormData = {
  name: string;
  expiracy_expires: boolean;
  expiracy_on_expiration: 'allow_sales' | 'prevent_sales';
  groups_product_subitems: ProductSubItemRow[];
  identification_barcode: string;
  identification_barcode_type: string;
  identification_category_id: number | null;
  identification_description: string | null;
  identification_sku: string;
  identification_status: 'available' | 'unavailable';
  identification_stock_management: 'enabled' | 'disabled';
  identification_type: 'materialized' | 'dematerialized' | 'grouped';
  images: string[];
  taxes_tax_group_id: number | null;
  taxes_tax_type: 'inclusive' | 'exclusive';
  units_accurate_tracking: boolean;
  units_auto_cogs: boolean;
  units_unit_group: number;
  units_selling_group: {
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
  }[];

  // tabs errors
  identification_error: string | null;
  groups_error: string | null;
  images_error: string | null;
  units_error: string | null;
  taxes_error: string | null;
  expiracy_error: string | null;
};

export const defaultFormData: ProductFormData = {
  name: '',
  expiracy_expires: false,
  expiracy_on_expiration: 'allow_sales',
  groups_product_subitems: [],
  identification_barcode: '',
  identification_barcode_type: 'code128',
  identification_category_id: null,
  identification_description: '',
  identification_sku: '',
  identification_status: 'available',
  identification_stock_management: 'enabled',
  identification_type: 'materialized',
  images: [],
  taxes_tax_group_id: null,
  taxes_tax_type: 'inclusive',
  units_accurate_tracking: false,
  units_auto_cogs: true,
  units_unit_group: 0,
  units_selling_group: [],

  // tabs errors
  identification_error: null,
  groups_error: null,
  images_error: null,
  units_error: null,
  taxes_error: null,
  expiracy_error: null,
};

export interface IdentificationTabProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
}

export interface UnitsTabProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
}

export interface ExpiryTabProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
}

export interface TaxesTabProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
}

export interface GroupsTabProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
}

export interface ImagesTabProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
  handleFileChange?: (files: File[]) => void;
}
