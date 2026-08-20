import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export interface CustomerGroupFormData {
    name: string;
    reward_system_id: string | number;
    minimal_credit_payment: string | number;
    description: string;
}

export type CustomerGroupFormMode = 'create' | 'edit';

export function useCustomerGroupForm(mode: CustomerGroupFormMode, group?: any) {
    const { t } = useTranslation();

    const form = useForm<CustomerGroupFormData>(
        mode === 'edit' && group
            ? {
                  name: group.name ?? '',
                  reward_system_id: group.reward_system_id ?? '',
                  minimal_credit_payment: group.minimal_credit_payment ?? '',
                  description: group.description ?? '',
              }
            : {
                  name: '',
                  reward_system_id: '',
                  minimal_credit_payment: '',
                  description: '',
              },
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: keyof CustomerGroupFormData, value: string | number) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();
        if (!form.data.name?.trim()) {
            form.setError('name', t('Name is required'));
            isValid = false;
        }
        return isValid;
    };

    const buildTransform = () => ({
        name: form.data.name,
        general: {
            reward_system_id: form.data.reward_system_id,
            minimal_credit_payment: form.data.minimal_credit_payment,
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
            form.put(`/api/crud/ns.customers-groups/${group.id}`, {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Successfully saved')),
            });
        } else {
            form.post('/api/crud/ns.customers-groups', {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Customer group created successfully')),
            });
        }
    };

    return { form, handleSubmit, handleInputChange, handleSelectChange };
}
