import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { customersApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { formatCurrency, formatDateTime } from '@/utils/format';
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

export default function CustomerOrdersPage() {
    const { t } = useTranslation();
    const { customer } = usePage<PageProps>().props;
    const customerName = `${customer.first_name} ${customer.last_name}`.trim();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customers'), href: '/dashboard/customers' },
        { title: customerName, href: `/dashboard/customers/edit/${customer.id}` },
        { title: t('Orders'), href: `/dashboard/customers/${customer.id}/orders` },
    ];

    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            setOrders(await customersApi.getOrders(customer.id));
        } catch (error) {
            console.error(error);
            toast.error(getApiErrorMessage(error, t('An unexpected error occurred.')));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns: ColumnDef<CustomerOrder>[] = [
        {
            accessorKey: 'code',
            header: t('Code'),
        },
        {
            accessorKey: 'type',
            header: t('Order Type'),
        },
        {
            accessorKey: 'human_status',
            header: t('Payment Status'),
            cell: ({ row }) => {
                const variant = () => {
                    switch (row.getValue('human_status')) {
                        case 'Paid':
                            return 'success';
                        case 'Hold':
                        case 'Partially Paid':
                            return 'info';
                        case 'Partially Refunded':
                        case 'Refunded':
                            return 'default';
                        case 'Unpaid':
                        case 'Due':
                        case 'Due With Payment':
                            return 'danger';
                        case 'Voided':
                            return 'error';
                    }
                };
                return <Badge variant={variant()}>{row.getValue('human_status')}</Badge>;
            },
        },
        {
            accessorKey: 'human_delivery_status',
            header: t('Delivery Status'),
        },
        {
            accessorKey: 'total',
            header: t('Total'),
            cell: ({ row }) => formatCurrency(row.original.total),
        },
        {
            accessorKey: 'created_at',
            header: t('Date'),
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Customer Orders')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    data={orders}
                    title={t('Customer Orders')}
                    description={customerName}
                    searchKey="code"
                    isLoading={isLoading}
                    onRefresh={loadOrders}
                />
            </div>
        </AppLayout>
    );
}