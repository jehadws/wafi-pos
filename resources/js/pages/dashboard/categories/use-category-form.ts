import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        form.transform(() => buildTransform());

        if (mode === 'edit' && category) {
            form.put(`/api/crud/ns.products-categories/${category.id}`, {
                showProgress: true,
                onError,
                onSuccess: () => toast.info(t('The entry has been successfully updated.')),
            });
        } else {
            form.post('/api/crud/ns.products-categories', {
                showProgress: true,
                onError,
                onSuccess: () => toast.info(t('The category has been created')),
            });
        }
    };

    return { form, handleSubmit, handleInputChange };
}
