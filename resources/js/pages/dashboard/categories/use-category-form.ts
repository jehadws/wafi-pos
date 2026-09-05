import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { categoriesApi } from '@/api';
import { extractValidationErrors } from '@/utils/api-errors';
import { toast } from 'sonner';

export interface CategoryFormData {
    name: string;
    description: string;
    parent_id: number;
    displays_on_pos: number;
    preview_url: string;
}

export type CategoryFormMode = 'create' | 'edit';

export function useCategoryForm(mode: CategoryFormMode, category?: any) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CategoryFormData>(
        mode === 'edit' && category
            ? {
                  name: category.name ?? '',
                  description: category.description ?? '',
                  parent_id: category.parent_id ?? 0,
                  displays_on_pos: category.displays_on_pos ?? 0,
                  preview_url: category.preview_url ?? '',
              }
            : {
                  name: '',
                  description: '',
                  parent_id: 0,
                  displays_on_pos: 0,
                  preview_url: '',
              },
    );

    const handleInputChange = (name: keyof CategoryFormData, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value });
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

    const buildTransform = () => ({
        name: form.data.name,
        general: {
            description: form.data.description,
            parent_id: form.data.parent_id,
            displays_on_pos: form.data.displays_on_pos,
            preview_url: form.data.preview_url,
        },
    });

    const onError = (errors: Record<string, string>) => {
        console.error('Validation errors:', errors);
        if (errors.error) alert(errors.error);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (mode === 'edit' && category) {
                const res = await categoriesApi.update(category.id, buildTransform());
                toast.info(t('The entry has been successfully updated.'));
                if (res?.redirect) router.visit(res.redirect);
            } else {
                const res = await categoriesApi.create(buildTransform());
                toast.info(t('The category has been created'));
                if (res?.redirect) router.visit(res.redirect);
            }
        } catch (err) {
            onError(extractValidationErrors(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        form: { ...form, processing: isSubmitting || form.processing },
        handleSubmit,
        handleInputChange,
    };
}
