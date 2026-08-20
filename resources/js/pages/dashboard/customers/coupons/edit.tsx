import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import FormHeader from '@/components/forms/shared/form-header';
import { useTranslation } from '@/lib/i18n';
import { categoriesApi, customersApi, productsApi } from '@/api';
import { useEffect, useState } from 'react';
import { useCouponForm } from './use-coupon-form';
import { CouponFormFields } from './coupon-form-fields';

export default function EditCouponPage() {
    const { t } = useTranslation();
    const { coupon } = usePage<{ coupon: any }>().props;

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Coupons'), href: '/dashboard/customers/coupons' },
        { title: t('Edit Coupon'), href: `/dashboard/customers/coupons/${coupon?.id}/edit` },
    ];

    const { form, handleSubmit, handleInputChange, handleSelectChange, generateCouponCode } = useCouponForm('edit', coupon);

    useEffect(() => {
        const getData = async () => {
            const [productsRes, categoriesRes, groupsRes] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll(),
                customersApi.getGroups(),
            ]);
            setProducts(productsRes);
            setCategories(categoriesRes);
            setGroups(groupsRes);
        };

        getData();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit Coupon')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit Coupon')}
                        description={t('Modify coupon details.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <CouponFormFields
                        form={form}
                        products={products}
                        categories={categories}
                        groups={groups}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                        generateCouponCode={generateCouponCode}
                    />
                </div>
            </form>
        </AppLayout>
    );
}
