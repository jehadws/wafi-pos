import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export interface TaxFormData {
    name: string;
    description: string;
    tax_group_id: string | number;
    rate: string | number;
}

export type TaxFormMode = 'create' | 'edit';

export function useTaxForm(mode: TaxFormMode, tax?: any) {
    const { t } = useTranslation();

    const form = useForm<TaxFormData>(
        mode === 'edit' && tax
            ? {
                  name: tax.name ?? '',
                  description: tax.description ?? '',
                  tax_group_id: tax.tax_group_id ?? '',
                  rate: tax.rate ?? '',
              }
            : {
                  name: '',
                  description: '',
                  tax_group_id: '',
                  rate: '',
              },
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: keyof TaxFormData, value: string | number) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.name.trim()) {
            form.setError('name', t('Tax name is required'));
            isValid = false;
        }
        if (!String(form.data.rate).trim()) {
            form.setError('rate', t('Rate is required'));
            isValid = false;
        }
        if (!form.data.tax_group_id) {
            form.setError('tax_group_id', t('Tax group is required'));
            isValid = false;
        }

        return isValid;
    };

    const buildTransform = () => ({
        name: form.data.name,
        general: {
            description: form.data.description,
            tax_group_id: form.data.tax_group_id,
            rate: form.data.rate,
        },
    });

    const onError = (errors: Record<string, string>) => {
        console.error('Validation errors:', errors);
        toast.error(t('Please fix the validation errors'));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;
        form.transform(() => buildTransform());

        if (mode === 'edit' && tax) {
            form.put(`/api/crud/ns.taxes/${tax.id}`, {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Successfully saved')),
            });
        } else {
            form.post('/api/crud/ns.taxes', {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Tax created successfully')),
            });
        }
    };

    return { form, handleSubmit, handleInputChange, handleSelectChange };
}
