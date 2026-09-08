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

export default function CustomerAccountHistoryPage() {
    const { t } = useTranslation();
    const { customer } = usePage<PageProps>().props;
    const customerName = `${customer.first_name} ${customer.last_name}`.trim();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customers'), href: '/dashboard/customers' },
        { title: customerName, href: `/dashboard/customers/edit/${customer.id}` },
        { title: t('Wallet History'), href: `/dashboard/customers/${customer.id}/account-history` },
    ];

    const [history, setHistory] = useState<CustomPaginationData<CustomerAccountHistory>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: '',
        per_page: 20,
        prev_page_url: null,
        to: 0,
        total: 0,
        from: 0,
        last_page_url: '',
        first_page_url: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = async (page: number) => {
        setIsLoading(true);
        try {
            setHistory(await customersApi.getAccountHistory(customer.id, page));
        } catch (error) {
            console.error(error);
            toast.error(getApiErrorMessage(error, t('An unexpected error occurred.')));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const operationVariant = (operation: string) => {
        switch (operation) {
            case 'add':
                return 'success';
            case 'payment':
                return 'info';
            case 'deduct':
                return 'danger';
            default:
                return 'default';
        }
    };

    const operationLabel = (operation: string) => {
        switch (operation) {
            case 'add':
                return t('Add');
            case 'deduct':
                return t('Deduct');
            case 'payment':
                return t('Payment');
            default:
                return t('Refund');
        }
    };

    const columns: ColumnDef<CustomerAccountHistory>[] = [
        {
            accessorKey: 'operation',
            header: t('Operation'),
            cell: ({ row }) => (
                <Badge variant={operationVariant(row.original.operation)}>{operationLabel(row.original.operation)}</Badge>
            ),
        },
        {
            accessorKey: 'amount',
            header: t('Amount'),
            cell: ({ row }) => formatCurrency(row.original.amount),
        },
        {
            accessorKey: 'description',
            header: t('Description'),
            cell: ({ row }) => row.original.description ?? '—',
        },
        {
            accessorKey: 'created_at',
            header: t('Date'),
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Account History')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    data={history as unknown as CustomerAccountHistory[]}
                    title={t('Account History')}
                    description={customerName}
                    searchKey="description"
                    isLoading={isLoading}
                    onRefresh={() => loadHistory(currentPage)}
                    useCustomPagination
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>
        </AppLayout>
    );
}