import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export interface UnitGroupFormData {
    name: string;
    description: string;
}

export type UnitGroupFormMode = 'create' | 'edit';

export function useUnitGroupForm(mode: UnitGroupFormMode, group?: any) {
    const { t } = useTranslation();

    const form = useForm<UnitGroupFormData>(
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

    const handleInputChange = (name: keyof UnitGroupFormData, value: string) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();
        if (!form.data.name.trim()) {
            form.setError('name', t('Name is required'));
            isValid = false;
        }
        return isValid;
    };

    const onError = (errors: Record<string, string>) => {
        console.error('Validation errors:', errors);
        if (errors.error) alert(errors.error);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (mode === 'edit' && group) {
            form.put(`/api/crud/ns.units-groups/${group.id}`, {
                showProgress: true,
                onError,
                onSuccess: () => {
                    toast.success(t('Successfully saved'));
                },
            });
        } else {
            form.post(route('ns.units.postGroup'), {
                showProgress: true,
                onError,
                onSuccess: () => {
                    toast.success(t('Unit group created successfully'));
                },
            });
        }
    };

    return { form, handleSubmit, handleInputChange };
}
