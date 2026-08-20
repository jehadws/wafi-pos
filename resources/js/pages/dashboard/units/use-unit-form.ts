/**
 * pages/dashboard/units/use-unit-form.ts
 * Shared hook for units create & edit.
 */
import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export interface UnitFormData {
    name: string;
    description: string;
    group_id: string | number;
    value: string | number;
    base_unit: number;
    identifier: string;
    preview_url: string;
}

export type UnitFormMode = 'create' | 'edit';

export function useUnitForm(mode: UnitFormMode, unit?: any) {
    const { t } = useTranslation();

    const form = useForm<UnitFormData>(
        mode === 'edit' && unit
            ? {
                  name: unit.name ?? '',
                  description: unit.description ?? '',
                  group_id: unit.group_id ?? '',
                  value: unit.value ?? '',
                  base_unit: unit.base_unit ? 1 : 0,
                  identifier: unit.identifier ?? '',
                  preview_url: unit.preview_url ?? '',
              }
            : { name: '', description: '', group_id: '', value: '', base_unit: 0, identifier: '', preview_url: '' },
    );

    const handleInputChange = (name: keyof UnitFormData, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();
        if (!form.data.name.trim()) { form.setError('name', t('Name is required')); isValid = false; }
        if (!form.data.group_id) { form.setError('group_id', t('Group is required')); isValid = false; }
        if (!form.data.value) { form.setError('value', t('Value is required')); isValid = false; }
        return isValid;
    };

    const buildTransform = () => ({
        name: form.data.name,
        general: {
            identifier: form.data.identifier,
            preview_url: form.data.preview_url,
            value: form.data.value,
            group_id: +form.data.group_id,
            base_unit: +form.data.base_unit,
            description: form.data.description,
        },
    });

    const onError = (errors: Record<string, string>) => {
        console.error('Validation errors:', errors);
        if (errors.error) alert(errors.error);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        form.transform(() => buildTransform());

        if (mode === 'edit' && unit) {
            form.put(`/api/crud/ns.units/${unit.id}`, {
                showProgress: true,
                onError,
                onSuccess: () => toast.info(t('The entry has been successfully updated.')),
            });
        } else {
            form.post('/api/crud/ns.units', {
                showProgress: true,
                onError,
                onSuccess: () => toast.info(t('The Unit has been created.')),
            });
        }
    };

    return { form, handleSubmit, handleInputChange };
}
