import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface CouponFormData {
    name: string;
    code: string;
    type: string;
    discount_value: number;
    minimum_cart_value: number;
    maximum_cart_value: number;
    valid_until: any;
    valid_hours_end: any;
    valid_hours_start: any;
    limit_usage: number;
    description: string;
    selected_products: number[];
    selected_categories: number[];
    selected_groups: number[];
}

export type CouponFormMode = 'create' | 'edit';

export function useCouponForm(mode: CouponFormMode, coupon?: any) {
    const { t } = useTranslation();

    const form = useForm<CouponFormData>(
        mode === 'edit' && coupon
            ? {
                  name: coupon.name ?? '',
                  code: coupon.code ?? '',
                  type: coupon.type ?? 'percentage_discount',
                  discount_value: coupon.discount_value ?? 0,
                  minimum_cart_value: coupon.minimum_cart_value ?? 0,
                  maximum_cart_value: coupon.maximum_cart_value ?? 0,
                  valid_until: coupon.valid_until ?? Date.now(),
                  valid_hours_end: coupon.valid_hours_end ?? Date.now(),
                  valid_hours_start: coupon.valid_hours_start ?? Date.now(),
                  limit_usage: coupon.limit_usage ?? 1,
                  description: coupon.description ?? '',
                  selected_products: coupon.products?.map((p: any) => p.product_id) || [],
                  selected_categories: coupon.categories?.map((c: any) => c.category_id) || [],
                  selected_groups: coupon.groups?.map((g: any) => g.group_id) || [],
              }
            : {
                  name: '',
                  code: '',
                  type: 'percentage_discount',
                  discount_value: 0,
                  minimum_cart_value: 0,
                  maximum_cart_value: 0,
                  valid_until: Date.now(),
                  valid_hours_end: Date.now(),
                  valid_hours_start: Date.now(),
                  limit_usage: 1,
                  description: '',
                  selected_products: [],
                  selected_categories: [],
                  selected_groups: [],
              },
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: keyof CouponFormData, value: any) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const generateCouponCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        form.setData({ ...form.data, code });
        toast.info(t('Generated code: {{code}}', { code }));
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();
        if (!form.data.name.trim()) {
            form.setError('name', t('Coupon name is required'));
            isValid = false;
        }
        if (!form.data.code.trim()) {
            form.setError('code', t('Coupon code is required'));
            isValid = false;
        }
        return isValid;
    };

    const buildTransform = () => ({
        name: form.data.name,
        general: {
            code: form.data.code,
            discount_value: form.data.discount_value,
            limit_usage: form.data.limit_usage,
            maximum_cart_value: form.data.maximum_cart_value,
            minimum_cart_value: form.data.minimum_cart_value,
            type: form.data.type,
            valid_hours_end: form.data.valid_hours_end ? format(new Date(form.data.valid_hours_end), 'yyyy-MM-dd HH:mm:ss') : '',
            valid_hours_start: form.data.valid_hours_start ? format(new Date(form.data.valid_hours_start), 'yyyy-MM-dd HH:mm:ss') : '',
            valid_until: form.data.valid_until,
        },
        selected_categories: {
            categories: form.data.selected_categories,
        },
        selected_groups: {
            groups: form.data.selected_groups,
        },
        selected_products: {
            products: form.data.selected_products,
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

        if (mode === 'edit' && coupon) {
            form.put(`/api/crud/ns.coupons/${coupon.id}`, {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Successfully saved')),
            });
        } else {
            form.post('/api/crud/ns.coupons', {
                preserveScroll: true,
                onError,
                onSuccess: () => toast.success(t('Coupon created successfully')),
            });
        }
    };

    return { form, handleSubmit, handleInputChange, handleSelectChange, generateCouponCode };
}
