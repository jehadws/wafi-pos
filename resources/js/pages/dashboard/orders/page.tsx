import ConfirmationDialog from '@/components/confirmation-dialog';
import OrderOptionsDialog from '@/components/forms/orders/order-options-dialog';
import OrdersFilterDialog from '@/components/forms/orders/orders-filter-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatDateTime } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { Copy, FileText, List, MoreHorizontal, ReceiptText, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TFilter = {
    'jgrem_orders.created_at': {
        startDate: null | string;
        endDate: null | string;
    };
    payment_status: null | string;
    'jgrem_orders.author': null | string;
    customer_id: null | string;
    register_id: null | string;
    customer_phone: null | string;
};

export default function Dashboard() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Orders List'), href: '/dashboard/orders' },
    ];
    const [orders, setOrders] = useState<CustomPaginationData<Order>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: 'http://127.0.0.1:8000/api/crud/ns.orders',
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<TFilter | {}>({
        'jgrem_orders.created_at': {
            startDate: null,
            endDate: null,
        },
        payment_status: null,
        'jgrem_orders.author': null,
        customer_id: null,
        register_id: null,
        customer_phone: null,
    });

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        item: Order | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const [optionsDialog, setOptionsDialog] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));
        try {
            await axios.delete(`/api/crud/ns.orders/${deleteDialog.item.id}`);
            toast.success(t('The order and the attached products has been deleted.'));
            setCurrentPage(1);
            getOrders(1, pageSize, filters);
        } catch (error) {
            toast.error(t('An unexpected error occurred.'));
        } finally {
            setDeleteDialog({
                isOpen: false,
                loading: false,
                item: null,
            });
        }
    };

    const columns: ColumnDef<Order>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label={t('Select all')}
                />
            ),
            cell: ({ row }) => (
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label={t('Select row')} />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'code',
            header: t('Code'),
        },
        {
            accessorKey: 'type',
            header: t('Type'),
        },
        {
            accessorKey: 'customer_first_name',
            header: t('Customer'),
            cell: ({ row }) => {
                return row.original.customer_first_name;
            },
        },
        {
            accessorKey: 'delivery_status',
            header: t('Delivery'),
        },
        {
            accessorKey: 'payment_status',
            header: t('Payment Status'),
            cell: ({ row }) => {
                const variant = () => {
                    switch (row.getValue('payment_status')) {
                        case 'Paid':
                            return 'success';
                        case 'Hold':
                            return 'info';
                        case 'Partially Paid':
                            return 'info';
                        case 'Partially Refunded':
                            return 'default';
                        case 'Refunded':
                            return 'default';
                        case 'Unpaid':
                            return 'danger';
                        case 'Voided':
                            return 'error';
                        case 'Due':
                            return 'danger';
                        case 'Due With Payment':
                            return 'danger';
                    }
                };
                return <Badge variant={variant()}>{row.getValue('payment_status')}</Badge>;
            },
        },
        {
            accessorKey: 'tax_value',
            header: t('Tax'),
        },
        {
            accessorKey: 'total',
            header: t('Total'),
        },
        {
            accessorKey: 'author_username',
            header: t('Author'),
        },
        {
            accessorKey: 'created_at',
            header: t('On'),
            cell: ({ row }) => {
                return formatDateTime(row.getValue('created_at'));
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setOptionsDialog({ isOpen: true, id: row.original.id })}>
                                <List className="mr-2 h-4 w-4" />
                                {t('Options')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.code.toString())}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('Copy Code')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/orders/invoice/${item.id}`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                {t('Invoice')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/orders/receipt/${item.id}`)}>
                                <ReceiptText className="mr-2 h-4 w-4" />
                                {t('Receipt')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteDialog({ isOpen: true, loading: false, item: row.original })}
                                className="text-destructive"
                            >
                                <Trash2 className="text-destructive mr-2 h-4 w-4" />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const bulkActions = [
        {
            label: t('Delete Selected'),
            action: (selectedRows: Order[]) => {
                const payload = {
                    action: 'delete_selected',
                    entries: selectedRows.map((row) => row.id),
                };

                router.post('/api/crud/ns.orders/bulk-actions', payload, {
                    onError: (errors) => {
                        toast.error(t('Operation failed'));
                        console.error('Error:', errors);
                    },
                    onSuccess: () => {
                        toast.success(t('Successfully processed selected items'));
                        router.reload();
                    },
                });
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('dashboard.pos'));
    };

    const handleRefresh = () => {
        getOrders(currentPage, pageSize, filters);
    };

    const getOrders = async (page: number, pageSize: number, filters: object) => {
        try {
            const res = await axios.get(`/api/crud/ns.orders?page=${page}&per_page=${pageSize}`, {
                params: { queryFilters: JSON.stringify(filters), search: searchTerm },
            });
            console.log('Orders', res.data);
            setOrders(res.data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const handleFilter = async (queryFilters: any) => {
        setFilters(queryFilters);
        setCurrentPage(1);
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setFilters({});
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
        getOrders(currentPage, pageSize, filters);
    }, [currentPage, pageSize, filters, searchTerm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={'Orders List'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={orders}
                        bulkActions={bulkActions}
                        title={t('Orders List')}
                        onAddNew={handleAddNew}
                        description={t('Display all orders.')}
                        searchKey="code"
                        onRefresh={handleRefresh}
                        customFilterDialog
                        onOpenCustomFilterDialog={() => setIsFilterOpen(true)}
                        useCustomPagination
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        useServerSideSearch={true}
                        onSearch={handleSearch}
                        searchValue={searchTerm}
                    />
                </div>

                <ConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, loading: false, item: null })}
                    onConfirm={handleDeleteConfirm}
                    title={`${t('Delete')} ${deleteDialog.item?.code}`}
                    description={t('Would you like to delete this item ?')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>

            <OrdersFilterDialog
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                handleResetFilters={handleResetFilters}
                handleFilter={handleFilter}
            />
            <OrderOptionsDialog options={optionsDialog} setOptions={setOptionsDialog} />
        </AppLayout>
    );
}
