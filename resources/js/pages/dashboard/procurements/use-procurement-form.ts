import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { procurementsApi } from '@/api';
import { toast } from 'sonner';
import {
    buildProcurementPayload,
    calculateLineItemPrices,
    ProcurementProductItem,
} from '@/services/procurement';

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

export type ProcurementModalState = {
    type: 'options' | 'unit' | 'tax' | 'convert' | null;
    product_id: number | null;
    group_id: number | null;
};

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

    const form = useForm<ProcurementFormData>({
        name: initialData?.name ?? '',
        general_automatic_approval: initialData?.automatic_approval ?? 1,
        general_delivery_status: initialData?.delivery_status ?? 'delivered',
        general_delivery_time: initialData?.delivery_time ?? '2025-06-14',
        general_invoice_date: initialData?.invoice_date ?? '2025-06-14',
        general_invoice_reference: initialData?.invoice_reference ?? '',
        general_payment_status: initialData?.payment_status ?? 'paid',
        general_provider_id: initialData?.provider_id ?? '',
        products: initialData?.products ?? [],
    });

    const handleInputChange = (name: keyof ProcurementFormData, value: any) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const addProduct = (product: any) => {
        const newProduct: ProcurementProductItem = {
            product_id: product.id,
            id: product.id,
            name: product.name,
            expiration_date: null,
            gross_purchase_price: 0,
            purchase_price_edit: 0,
            net_purchase_price: null,
            purchase_price: 0,
            total_price: 0,
            total_purchase_price: 0,
            quantity: 0,
            unit_id: product.unit_quantities?.length > 0 ? product.unit_quantities[0].unit_id : null,
            unit_group: product.unit_group,
            unit_quantities: product.unit_quantities || [],
            convert_unit_id: null,
            procurement_id: null,
            $invalid: false,
            convert_unit_label: null,
        };

        form.setData('products', [newProduct, ...form.data.products]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeProduct = (id: number) => {
        form.setData(
            'products',
            form.data.products.filter((p) => (p.product_id !== id && p.id !== id)),
        );
    };

    const updateProduct = (id: number, field: keyof ProcurementProductItem, value: any) => {
        form.setData(
            'products',
            form.data.products.map((p) => {
                if (p.product_id === id || p.id === id) {
                    if (field === 'purchase_price' || field === 'quantity') {
                        return calculateLineItemPrices(p, field, Number(value) || 0);
                    }
                    return { ...p, [field]: value };
                }
                return p;
            }),
        );
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
                const data = groupUnits.filter(
                    (unit: any) => !form.data.products.find((p) => p.unit_quantities?.find((uq: any) => uq.unit_id === unit.id)),
                );
                setUnits(data);
            }
        } catch (error) {
            console.error('Error getting convert units:', error);
        }
    };

    const validateForm = (): boolean => {
        form.clearErrors();
        return true;
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
                    console.error('Validation errors:', errors);
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
                    console.error('Validation errors:', errors);
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
