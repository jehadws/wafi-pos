/**
 * pages/dashboard/users/use-user-form.ts
 *
 * Shared form hook for users create & edit.
 * Single Responsibility: owns form state, validation, event handlers,
 * and the submit transform. The page component supplies only the mode
 * ('create' | 'edit') and the optional existing user data.
 */

import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserFormData {
    username: string;
    general_active: number;
    general_birth_date: string;
    general_credit_limit_amount: string | number;
    general_email: string;
    general_first_name: string;
    general_gender: string;
    general_group_id: string | number;
    general_last_name: string;
    general_phone: string;
    general_pobox: string;
    general_roles: number[];
    general_password: string;
    general_password_confirm: string;
    billing_first_name: string;
    billing_last_name: string;
    billing_phone: string;
    billing_address_1: string;
    billing_address_2: string;
    billing_country: string;
    billing_city: string;
    billing_pobox: string;
    billing_company: string;
    billing_email: string;
    shipping_first_name: string;
    shipping_last_name: string;
    shipping_phone: string;
    shipping_address_1: string;
    shipping_address_2: string;
    shipping_country: string;
    shipping_city: string;
    shipping_pobox: string;
    shipping_company: string;
    shipping_email: string;
}

export type UserFormMode = 'create' | 'edit';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const emptyDefaults = (): UserFormData => ({
    username: '',
    general_active: 0,
    general_birth_date: '',
    general_credit_limit_amount: '',
    general_email: '',
    general_first_name: '',
    general_gender: '',
    general_group_id: '',
    general_last_name: '',
    general_phone: '',
    general_pobox: '',
    general_roles: [],
    general_password: '',
    general_password_confirm: '',
    billing_first_name: '',
    billing_last_name: '',
    billing_phone: '',
    billing_address_1: '',
    billing_address_2: '',
    billing_country: '',
    billing_city: '',
    billing_pobox: '',
    billing_company: '',
    billing_email: '',
    shipping_first_name: '',
    shipping_last_name: '',
    shipping_phone: '',
    shipping_address_1: '',
    shipping_address_2: '',
    shipping_country: '',
    shipping_city: '',
    shipping_pobox: '',
    shipping_company: '',
    shipping_email: '',
});

const editDefaults = (user: any): UserFormData => ({
    username: user.username ?? '',
    general_active: user.active ? 1 : 0,
    general_birth_date: user.birth_date ?? '',
    general_credit_limit_amount: user.credit_limit_amount ?? 0,
    general_email: user.email ?? '',
    general_first_name: user.first_name ?? '',
    general_gender: user.gender ?? '',
    general_group_id: user.group_id ?? '',
    general_last_name: user.last_name ?? '',
    general_phone: user.phone ?? '',
    general_pobox: user.pobox ?? '',
    general_roles: user.roles != null ? user.roles.map((r: any) => r.id) : [],
    general_password: '',
    general_password_confirm: '',
    billing_first_name: user.billing?.first_name ?? '',
    billing_last_name: user.billing?.last_name ?? '',
    billing_phone: user.billing?.phone ?? '',
    billing_address_1: user.billing?.address_1 ?? '',
    billing_address_2: user.billing?.address_2 ?? '',
    billing_country: user.billing?.country ?? '',
    billing_city: user.billing?.city ?? '',
    billing_pobox: user.billing?.pobox ?? '',
    billing_company: user.billing?.company ?? '',
    billing_email: user.billing?.email ?? '',
    shipping_first_name: user.shipping?.first_name ?? '',
    shipping_last_name: user.shipping?.last_name ?? '',
    shipping_phone: user.shipping?.phone ?? '',
    shipping_address_1: user.shipping?.address_1 ?? '',
    shipping_address_2: user.shipping?.address_2 ?? '',
    shipping_country: user.shipping?.country ?? '',
    shipping_city: user.shipping?.city ?? '',
    shipping_pobox: user.shipping?.pobox ?? '',
    shipping_company: user.shipping?.company ?? '',
    shipping_email: user.shipping?.email ?? '',
});

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useUserForm
 *
 * @param mode  - 'create' or 'edit'
 * @param user  - Existing user data (required when mode === 'edit')
 */
export function useUserForm(mode: UserFormMode, user?: any) {
    const { t } = useTranslation();

    const form = useForm<UserFormData>(
        mode === 'edit' && user ? editDefaults(user) : emptyDefaults(),
    );

    // ── Event handlers ──────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value } as UserFormData);
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name as any);
    };

    const handleSelectChange = (name: string, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value } as UserFormData);
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name as any);
    };

    // ── Validation ──────────────────────────────────────────────────────────

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.username.trim()) {
            form.setError('username', t('Username is required'));
            isValid = false;
        }
        if (!form.data.general_group_id) {
            form.setError('general_group_id', t('Group is required'));
            isValid = false;
        }
        if (!form.data.general_email) {
            form.setError('general_email', t('Email is required'));
            isValid = false;
        }

        return isValid;
    };

    // ── Shared transform (flattens flat form keys → nested API shape) ───────

    const buildTransform = () => ({
        username: form.data.username,
        general: {
            first_name: form.data.general_first_name,
            last_name: form.data.general_last_name,
            credit_limit_amount: form.data.general_credit_limit_amount,
            group_id: form.data.general_group_id,
            birth_date:
                form.data.general_birth_date !== ''
                    ? format(new Date(form.data.general_birth_date), 'yyyy-MM-dd HH:mm:ss')
                    : '',
            email: form.data.general_email,
            phone: form.data.general_phone,
            pobox: form.data.general_pobox,
            gender: form.data.general_gender,
            active: form.data.general_active,
            roles: form.data.general_roles,
            // Only include password fields when they are filled in
            ...(form.data.general_password && form.data.general_password_confirm
                ? {
                      password: form.data.general_password,
                      password_confirmation: form.data.general_password_confirm,
                  }
                : {}),
        },
        billing: {
            first_name: form.data.billing_first_name,
            last_name: form.data.billing_last_name,
            phone: form.data.billing_phone,
            address_1: form.data.billing_address_1,
            address_2: form.data.billing_address_2,
            country: form.data.billing_country,
            city: form.data.billing_city,
            pobox: form.data.billing_pobox,
            company: form.data.billing_company,
            email: form.data.billing_email,
        },
        shipping: {
            first_name: form.data.shipping_first_name,
            last_name: form.data.shipping_last_name,
            phone: form.data.shipping_phone,
            address_1: form.data.shipping_address_1,
            address_2: form.data.shipping_address_2,
            country: form.data.shipping_country,
            city: form.data.shipping_city,
            pobox: form.data.shipping_pobox,
            company: form.data.shipping_company,
            email: form.data.shipping_email,
        },
    });

    // ── Shared error handler ─────────────────────────────────────────────────

    const handleErrors = (errors: Record<string, string>) => {
        form.clearErrors();
        for (const key in errors) {
            const flatKey = key.replace(/\./g, '_') as keyof UserFormData;
            if (flatKey in form.data) {
                form.setError(flatKey, errors[key]);
            }
        }
        toast.error(t('Please fix the validation errors'));
        console.error('Validation errors:', errors);
    };

    // ── Submit handlers ──────────────────────────────────────────────────────

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        form.transform(() => buildTransform());
        form.post('/api/crud/ns.users', {
            preserveScroll: true,
            onError: handleErrors,
            onSuccess: () => toast.success(t('Successfully saved')),
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        form.transform(() => buildTransform());
        form.put(`/api/crud/ns.users/${user?.id}`, {
            preserveScroll: true,
            onError: handleErrors,
            onSuccess: () => toast.success(t('Successfully saved')),
        });
    };

    const handleSubmit = mode === 'edit' ? handleEdit : handleCreate;

    return {
        form,
        handleSubmit,
        handleInputChange,
        handleSelectChange,
    };
}
