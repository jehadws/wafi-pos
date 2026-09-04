import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { unitsApi } from '@/api';
import { extractValidationErrors } from '@/utils/api-errors';
import { toast } from 'sonner';

export interface UnitGroupFormData {
    name: string;
    description: string;
}

export type UnitGroupFormMode = 'create' | 'edit';

export function useUnitGroupForm(mode: UnitGroupFormMode, group?: any) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        if (mode === 'edit' && group) {
            setIsSubmitting(true);
            try {
                const res = await unitsApi.updateGroup(group.id, { ...form.data });
                toast.success(t('Successfully saved'));
                if (res?.redirect) router.visit(res.redirect);
            } catch (err) {
                onError(extractValidationErrors(err));
            } finally {
                setIsSubmitting(false);
            }
        } else {
            form.post(route('sb.units.postGroup'), {
                showProgress: true,
                onError,
                onSuccess: () => {
                    toast.success(t('Unit group created successfully'));
                },
            });
        }
    };

    return {
        form: { ...form, processing: isSubmitting || form.processing },
        handleSubmit,
        handleInputChange,
    };
}
