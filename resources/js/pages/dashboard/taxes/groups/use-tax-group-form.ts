import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export interface TaxGroupFormData {
    name: string;
    description: string;
}

export type TaxGroupFormMode = 'create' | 'edit';

export function useTaxGroupForm(mode: TaxGroupFormMode, group?: any) {
    const { t } = useTranslation();

    const form = useForm<TaxGroupFormData>(
        mode === 'edit' && group
            ? {
                  name: group.name ?? '',
                  description: group.description ?? '',
              }
            : {
                  name: '',
                  description: '',
              },
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();
        if (!form.data.name.trim()) {
            form.setError('name', t('Tax group name is required'));
            isValid = false;
        }
        return isValid;
    };

    const buildTransform = () => ({
        name: form.data.name,
        general: {
            description: form.data.description,
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

        if (mode === 'edit' && group) {
            form.put(`/api/crud/ns.taxes-groups/${group.id}`, {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Successfully saved')),
            });
        } else {
            form.post('/api/crud/ns.taxes-groups', {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Successfully saved')),
            });
        }
    };

    return { form, handleSubmit, handleInputChange };
}
