import { procurementsApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { calculateLineItemPrices, type ProcurementProductItem } from '@/services/procurement';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProcurementItemModals } from './procurement-item-modals';
import { ProcurementProductsTab } from './procurement-products-tab';
import { registerCustomComponent, type CustomFieldComponentProps } from './registry';

/**
 * `procurementProducts` — the root-level custom section registered by
 * `ProcurementCrud::getForm` (`products: {component, taxGroups, value}`,
 * Phase 1 of `docs/plans/backend-driven-completion`).
 *
 * Ports the hand create/edit page's products tab + item modals 1:1 behind
 * one registry boundary: the rows are owned by the parent `ConfigForm`
 * (`value`/`onChange`), search + unit/tax/convert modals are local UI
 * state, and line prices recompute through `calculateLineItemPrices` on
 * every row mutation. Client bookkeeping (`_key`, `$invalid`) stays on the
 * rows — `buildCrudPayload` strips it at submit. Row required-ness
 * (`unit_id`, positive `quantity`) is enforced server-side
 * (`ProcurementRequest`); the `$invalid` marking here is the visual
 * parity with the hand page, recomputed on every row edit, and server
 * 422s surface through the section banner (`error` prop).
 */

/** Modal state of the item modals (`ProcurementModalState` in the hand hook). */
export type ProcurementModalState = {
  type: 'options' | 'unit' | 'tax' | 'convert' | null;
  /** Holds the product row's `_key` (string) — the client-side row identity. */
  product_id: number | string | null;
  group_id: number | null;
};

/** Build a unique client-side row key (stable across product_id / procurement-product id collisions). */
export const makeRowKey = (product_id: number, id?: number | null) => `row-${id ?? 'new'}-${product_id}-${Math.random().toString(36).slice(2, 9)}`;

/** Ensure every product row carries a unique `_key` used for React keys + row mutations. */
export const normalizeProductRow = (product: ProcurementProductItem): ProcurementProductItem => ({
  ...product,
  _key: product._key ?? makeRowKey(product.product_id, product.id),
});

/**
 * Defaults for a row added via product search (the hand `addProduct`
 * shape). No procurement-product `id` here: only rows loaded from an
 * existing procurement carry one — sending the catalog product id would
 * make the backend `ProcurementProduct::find($id)` overwrite an unrelated
 * row.
 */
export function createProcurementProductRow(product: { id: number; name: string; unit_group?: number; unit_quantities?: any[] }): ProcurementProductItem {
  return normalizeProductRow({
    product_id: product.id,
    name: product.name,
    expiration_date: null,
    gross_purchase_price: 0,
    purchase_price_edit: 0,
    net_purchase_price: null,
    purchase_price: 0,
    total_price: 0,
    total_purchase_price: 0,
    quantity: 1,
    unit_id: product.unit_quantities?.[0]?.unit_id ?? null,
    unit_group: product.unit_group,
    unit_quantities: product.unit_quantities || [],
    convert_unit_id: null,
    procurement_id: null,
    $invalid: false,
    convert_unit_label: null,
  });
}

/**
 * Update one row (a single field name or an atomic patch — used by modals
 * to update several related fields without lost-update races) and always
 * recompute the line prices afterwards.
 */
export function upsertProcurementProductRow(
  rows: ProcurementProductItem[],
  key: number | string,
  fieldOrPatch: keyof ProcurementProductItem | Partial<ProcurementProductItem>,
  value?: any,
): ProcurementProductItem[] {
  return rows.map((p) => {
    if (p._key !== key) {
      return p;
    }
    const patch = typeof fieldOrPatch === 'object' && fieldOrPatch !== null ? fieldOrPatch : { [fieldOrPatch]: value };
    const merged = { ...p, ...patch } as ProcurementProductItem;
    return calculateLineItemPrices(merged, 'quantity', Number(merged.quantity || 0));
  });
}

/** Remove a row by its client `_key`. */
export function removeProcurementProductRow(rows: ProcurementProductItem[], key: number | string): ProcurementProductItem[] {
  return rows.filter((p) => p._key !== key);
}

/**
 * Recompute the visual `$invalid` marking for every row: a row is invalid
 * without a unit or with a zero/negative quantity (server-side
 * `ProcurementRequest` enforces the same rules).
 */
export function markInvalidProcurementRows(rows: ProcurementProductItem[]): ProcurementProductItem[] {
  return rows.map((p) => ({ ...p, $invalid: !p.unit_id || !Number(p.quantity) || Number(p.quantity) <= 0 }));
}

type TaxGroupsProp = { id: number; name: string; taxes?: { id: number; rate: number }[] }[];

export function ProcurementProductsField({ field, value, onChange, error }: CustomFieldComponentProps) {
  const { t } = useTranslation();
  const rows: ProcurementProductItem[] = Array.isArray(value) ? (value as ProcurementProductItem[]) : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<ProcurementModalState>({
    type: null,
    product_id: null,
    group_id: null,
  });

  // Phase 1 seeds the tax groups on the section definition; the render
  // loop passes everything but `component`/`value`/`label` via `field.props`.
  const taxGroups = (Array.isArray(field.props?.taxGroups) ? field.props?.taxGroups : []) as TaxGroupsProp;

  /** Every row mutation re-emits the rows with a fresh `$invalid` marking. */
  const setRows = (next: ProcurementProductItem[]) => onChange(markInvalidProcurementRows(next));

  const addProduct = (product: any) => {
    // Dedupe: the same product can't be procured twice on one procurement.
    if (rows.some((p) => p.product_id === product.id)) {
      toast.warning(t('This product is already added to the procurement.'));
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    setRows([createProcurementProductRow(product), ...rows]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (key: number | string) => {
    setRows(removeProcurementProductRow(rows, key));
  };

  const updateProduct = (key: number | string, fieldOrPatch: keyof ProcurementProductItem | Partial<ProcurementProductItem>, rowValue?: any) => {
    setRows(upsertProcurementProductRow(rows, key, fieldOrPatch, rowValue));
  };

  const searchProduct = async (search: string) => {
    setSearchQuery(search);
    try {
      const results = await procurementsApi.searchProduct(search);
      if (results) {
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const getConvertUnits = async (group_id: number) => {
    try {
      const groupUnits = await procurementsApi.getUnitGroupUnits(group_id);
      if (groupUnits) {
        const data = groupUnits.filter((unit: any) => !rows.find((p) => p.unit_quantities?.find((uq: any) => uq.unit_id === unit.id)));
        setUnits(data);
      }
    } catch (error) {
      console.error('Error getting convert units:', error);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <ProcurementProductsTab
        form={{ data: { products: rows } }}
        searchQuery={searchQuery}
        searchResults={searchResults}
        taxGroups={taxGroups}
        onSearchQueryChange={setSearchQuery}
        onSearch={searchProduct}
        onSelectProduct={addProduct}
        onUpdateProduct={updateProduct}
        onRemoveProduct={removeProduct}
        onOpenModal={setActiveModal}
        onGetConvertUnits={getConvertUnits}
      />

      <ProcurementItemModals
        form={{ data: { products: rows } }}
        activeModal={activeModal}
        taxGroups={taxGroups}
        units={units}
        onCloseModal={() => {
          setUnits([]);
          setActiveModal({ type: null, product_id: null, group_id: null });
        }}
        onUpdateProduct={updateProduct}
      />
    </div>
  );
}

registerCustomComponent('procurementProducts', ProcurementProductsField);

