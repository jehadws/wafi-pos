import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { customersApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { formatCurrency, formatDate } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type PageProps = {
    customer: {
        id: number;
        first_name: string;
        last_name: string;
    };
};

export default function CustomerCouponsPage() {
    const { t } = useTranslation();
    const { customer } = usePage<PageProps>().props;
    const customerName = `${customer.first_name} ${customer.last_name}`.trim();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customers'), href: '/dashboard/customers' },
        { title: customerName, href: `/dashboard/customers/edit/${customer.id}` },
        { title: t('Coupons'), href: `/dashboard/customers/${customer.id}/coupons` },
    ];

    const [coupons, setCoupons] = useState<CustomerCouponRef[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadCoupons = async () => {
        setIsLoading(true);
        try {
            setCoupons(await customersApi.getCustomerCoupons(customer.id));
        } catch (error) {
            console.error(error);
            toast.error(getApiErrorMessage(error, t('An unexpected error occurred.')));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns: ColumnDef<CustomerCouponRef>[] = [
        {
            id: 'coupon_name',
            header: t('Name'),
            cell: ({ row }) => row.original.coupon?.name ?? '—',
        },
        {
            accessorKey: 'code',
            header: t('Code'),
        },
        {
            id: 'type',
            header: t('Type'),
            cell: ({ row }) => (row.original.coupon?.type === 'percentage_discount' ? t('Percentage Discount') : t('Flat Discount')),
        },
        {
            id: 'discount_value',
            header: t('Discount Value'),
            cell: ({ row }) => formatCurrency(row.original.coupon?.discount_value ?? 0),
        },
        {
            id: 'valid_until',
            header: t('Valid Until'),
            cell: ({ row }) => (row.original.coupon?.valid_until ? formatDate(row.original.coupon.valid_until) : '—'),
        },
        {
            accessorKey: 'active',
            header: t('Status'),
            cell: ({ row }) => (
                <Badge variant={row.original.active ? 'success' : 'danger'}>
                    {row.original.active ? t('Active') : t('Inactive')}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Customer Coupons')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    data={coupons}
                    title={t('Customer Coupons')}
                    description={customerName}
                    searchKey="code"
                    isLoading={isLoading}
                    onRefresh={loadCoupons}
                />
            </div>
        </AppLayout>
    );
}