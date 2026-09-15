import { procurementsApi } from '@/api';
import {
  createProcurementProductRow,
  markInvalidProcurementRows,
  normalizeProductRow,
  upsertProcurementProductRow,
  type ProcurementModalState,
} from '@/components/forms/config-form/procurement-products-field';
import { useTranslation } from '@/lib/i18n';
import { buildProcurementPayload, ProcurementProductItem } from '@/services/procurement';
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * The row logic lives in `components/forms/config-form/procurement-products-field.tsx`
 * (the `procurementProducts` registry component, Phase 2 of
 * docs/plans/backend-driven-completion); this hook is a thin wrapper kept
 * until Phase 3 deletes the hand create/edit pages.
 */
export type { ProcurementModalState };

export interface ProcurementFormData {
  name: string;
  general_automatic_approval: number;
  general_delivery_status: string;
  general_delivery_time: any;
  general_invoice_date: any;
  general_invoice_reference: string;
  general_payment_status: string;
  general_provider_id: string | number;
  products: ProcurementProductItem[];
}

export interface ProcurementInitialData {
  id: number;
  name: string;
  automatic_approval: number;
  delivery_status: string;
  delivery_time: any;
  invoice_date: any;
  invoice_reference: string;
  payment_status: string;
  provider_id: string | number;
  products: ProcurementProductItem[];
}

export function useProcurementForm(initialData?: ProcurementInitialData) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<ProcurementModalState>({
    type: null,
    product_id: null,
    group_id: null,
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const form = useForm<ProcurementFormData>({
    name: initialData?.name ?? '',
    general_automatic_approval: initialData?.automatic_approval ?? 1,
    general_delivery_status: initialData?.delivery_status ?? 'delivered',
    general_delivery_time: initialData?.delivery_time ?? today,
    general_invoice_date: initialData?.invoice_date ?? today,
    general_invoice_reference: initialData?.invoice_reference ?? '',
    general_payment_status: initialData?.payment_status ?? 'paid',
    general_provider_id: initialData?.provider_id ?? '',
    products: (initialData?.products ?? []).map(normalizeProductRow),
  });

  const handleInputChange = (name: keyof ProcurementFormData, value: any) => {
    form.setData({ ...form.data, [name]: value });
    if (form.errors[name]) form.clearErrors(name);
  };

  const addProduct = (product: any) => {
    // Dedupe: the same product can't be procured twice on one procurement.
    if (form.data.products.some((p) => p.product_id === product.id)) {
      toast.warning(t('This product is already added to the procurement.'));
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    form.setData((data) => ({ ...data, products: [createProcurementProductRow(product), ...data.products] }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (key: number | string) => {
    form.setData((data) => ({
      ...data,
      products: data.products.filter((p) => p._key !== key),
    }));
  };

  /**
   * Update a product row. `field` may be a single field name or a patch
   * object (used by modals to update several related fields atomically,
   * avoiding lost-update races between consecutive calls).
   * Always recomputes the line prices afterwards.
   */
  const updateProduct = (key: number | string, field: keyof ProcurementProductItem | Partial<ProcurementProductItem>, value?: any) => {
    form.setData((data) => ({
      ...data,
      products: upsertProcurementProductRow(data.products, key, field, value),
    }));
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
        const data = groupUnits.filter((unit: any) => !form.data.products.find((p) => p.unit_quantities?.find((uq: any) => uq.unit_id === unit.id)));
        setUnits(data);
      }
    } catch (error) {
      console.error('Error getting convert units:', error);
    }
  };

  const validateForm = (): boolean => {
    form.clearErrors();
    let valid = true;

    if (!form.data.name?.trim()) {
      form.setError('name', t('The procurement name is required.'));
      valid = false;
    }

    if (!form.data.general_provider_id) {
      form.setError('general_provider_id', t('Please select a provider.'));
      valid = false;
    }

    if (form.data.products.length === 0) {
      toast.error(t('Add at least one product to the procurement.'));
      valid = false;
    }

    const invalidRows = markInvalidProcurementRows(form.data.products);
    if (invalidRows.some((p) => p.$invalid)) {
      form.setData((data) => ({ ...data, products: markInvalidProcurementRows(data.products) }));
      toast.error(t('Every product needs a unit and a quantity greater than zero.'));
      valid = false;
    }

    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    const payload = buildProcurementPayload(
      form.data.name,
      {
        invoice_reference: form.data.general_invoice_reference,
        delivery_time: form.data.general_delivery_time,
        invoice_date: form.data.general_invoice_date,
        automatic_approval: form.data.general_automatic_approval,
        delivery_status: form.data.general_delivery_status,
        payment_status: form.data.general_payment_status,
        provider_id: form.data.general_provider_id,
      },
      form.data.products,
    );

    form.transform(() => payload);

    if (initialData?.id) {
      form.put(`/api/procurements/${initialData.id}`, {
        preserveScroll: true,
        onError: (errors) => {
          form.clearErrors();
          for (const key in errors) {
            const flatKey = key.replace(/\./g, '_') as keyof ProcurementFormData;
            if (flatKey in form.data) {
              form.setError(flatKey, errors[key]);
            }
          }
          toast.error(t('Please fix the validation errors'));
        },
        onSuccess: () => {
          toast.success(t('Procurement updated successfully'));
        },
      });
    } else {
      form.post('/api/procurements', {
        preserveScroll: true,
        onError: (errors) => {
          form.clearErrors();
          for (const key in errors) {
            const flatKey = key.replace(/\./g, '_') as keyof ProcurementFormData;
            if (flatKey in form.data) {
              form.setError(flatKey, errors[key]);
            }
          }
          toast.error(t('Please fix the validation errors'));
        },
        onSuccess: () => {
          toast.success(t('Procurement created successfully'));
        },
      });
    }
  };

  return {
    form,
    searchQuery,
    setSearchQuery,
    searchResults,
    units,
    setUnits,
    activeModal,
    setActiveModal,
    handleInputChange,
    addProduct,
    removeProduct,
    updateProduct,
    searchProduct,
    getConvertUnits,
    handleSubmit,
  };
}
