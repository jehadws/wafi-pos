import FormHeader from '@/components/forms/shared/form-header';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import { categoriesApi, customersApi, productsApi } from '@/api';
import { useEffect, useState } from 'react';
import { useCouponForm } from './use-coupon-form';
import { CouponFormFields } from './coupon-form-fields';

export default function CreateCouponPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    const { form, handleSubmit, handleInputChange, handleSelectChange, generateCouponCode } = useCouponForm('create');

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
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Coupons'), href: '/dashboard/customers/coupons' },
                { title: t('Create Coupon'), href: '/dashboard/customers/coupons/create' },
            ]}
        >
            <Head title={t('Create a new coupon')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new coupon')}
                        description={t('Register a new coupon and save it.')}
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
