import { DataTable } from '@/components/ui/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
        { title: 'Transactions History', href: '/dashboard/accounting/transactions/history' },
    ];

    const [transaction, setTransaction] = useState<CustomPaginationData<GlobalProductHistory>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: 'http://127.0.0.1:8000/api/crud/ns.global-products-history',
        per_page: 20,
        prev_page_url: null,
        to: 0,
        total: 0,
        from: 0,
        last_page_url: '',
        first_page_url: '',
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();

    const columns: ColumnDef<GlobalProductHistory>[] = [
        {
            accessorKey: 'product_name',
            header: t('product'),
        },
        {
            accessorKey: 'procurement_name',
            header: t('procurement'),
        },
        {
            accessorKey: 'order_code',
            header: t('order'),
        },
        {
            accessorKey: 'operation_type',
            header: t('operation_type'),
        },
        {
            accessorKey: 'unit_name',
            header: t('unit'),
        },
        {
            accessorKey: 'before_quantity',
            header: t('initial_quantity'),
        },
        {
            accessorKey: 'quantity',
            header: t('quantity'),
        },
        {
            accessorKey: 'after_quantity',
            header: t('new_quantity'),
        },
        {
            accessorKey: 'total_price',
            header: t('total_price'),
        },
        {
            accessorKey: 'user_username',
            header: t('author'),
        },
        {
            accessorKey: 'created_at',
            header: t('created_at'),
            cell: ({ row }) => {
                return formatDate(row.original.created_at);
            },
        },
    ];

    const handleRefresh = () => {
        getOrders(currentPage, pageSize);
    };

    const getOrders = async (page: number, pageSize: number) => {
        try {
            const res = await axios.get(`/api/crud/ns.global-products-history?page=${page}&per_page=${pageSize}`, {
                params: { search: searchTerm },
            });
            console.log('accounts', res.data);
            setTransaction(res.data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const handleSearch = (search: string) => {
        setSearchTerm(search);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    useEffect(() => {
        getOrders(currentPage, pageSize);
    }, [currentPage, pageSize, searchTerm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('product_histories_jgrem')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={transaction}
                        title={t('product_histories')}
                        description={t('display_all_product_stock_flow')}
                        searchKey="name"
                        onRefresh={handleRefresh}
                        useCustomPagination
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        useServerSideSearch={true}
                        onSearch={handleSearch}
                        searchValue={searchTerm}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
