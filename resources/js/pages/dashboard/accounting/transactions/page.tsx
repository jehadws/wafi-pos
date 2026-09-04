import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { crudApi, transactionsApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { Copy, Edit, List, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
    ];
    const [transaction, setTransaction] = useState<CustomPaginationData<Transaction>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: 'http://127.0.0.1:8000/api/crud/sb.transactions',
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

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        item: TransactionAccount | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            await transactionsApi.remove(deleteDialog.item.id);
            toast.success(t('Successfully deleted selected item'));
            handleRefresh();
        } catch (error) {
            toast.error(getApiErrorMessage(error, t('Operation failed')));
            console.error(error);
        } finally {
            setDeleteDialog({
                ...deleteDialog,
                loading: false,
                isOpen: false,
                item: null,
            });
        }
    };

    const columns: ColumnDef<TransactionAccount>[] = [
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
            accessorKey: 'name',
            header: t('Name'),
        },
        {
            accessorKey: 'type',
            header: t('Type'),
        },
        {
            accessorKey: 'transactions_accounts_name',
            header: t('Account Name'),
        },
        {
            accessorKey: 'value',
            header: t('Value'),
        },
        {
            accessorKey: 'recurring',
            header: t('Recurring'),
        },
        {
            accessorKey: 'occurrence',
            header: t('Occurrence'),
        },
        {
            accessorKey: 'user_username',
            header: t('Author'),
        },
        {
            accessorKey: 'created_at',
            header: t('Created At'),
            cell: ({ row }) => {
                return formatDate(row.original.created_at);
            },
        },
        {
            accessorKey: 'type',
            header: t('Type'),
        },
        {
            accessorKey: 'transactions_accounts_name',
            header: t('Account Name'),
        },
        {
            accessorKey: 'value',
            header: t('Value'),
        },
        {
            accessorKey: 'recurring',
            header: t('Recurring'),
        },
        {
            accessorKey: 'occurrence',
            header: t('Occurrence'),
        },
        {
            accessorKey: 'user_username',
            header: t('Author'),
        },
        {
            accessorKey: 'created_at',
            header: t('Created At'),
            cell: ({ row }) => {
                return formatDate(row.original.created_at);
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
                            <DropdownMenuLabel className="inline-flex items-center">
                                <List className="mr-2 h-4 w-4" />
                                {t('Options')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('Copy ID')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/accounting/transactions/edit/${item.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('Edit')}
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
            action: async (selectedRows: TransactionAccount[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await transactionsApi.bulkDelete(entries);
                    toast.success(t('Successfully processed selected items'));
                } catch (error) {
                    toast.error(getApiErrorMessage(error, t('Operation failed')));
                    console.error('Error:', error);
                } finally {
                    handleRefresh();
                }
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('sb.dashboard.transactions.create'));
    };

    const handleRefresh = () => {
        getOrders(currentPage, pageSize);
    };

    const getOrders = async (page: number, pageSize: number) => {
        try {
            const transactions = await crudApi.list('sb.transactions', { page, per_page: pageSize, search: searchTerm });
            setTransaction(transactions);
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
            <Head title={'Transactions List - Subul'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={transaction}
                        title={t('Transactions List')}
                        description={t('Display all transactions.')}
                        searchKey="name"
                        bulkActions={bulkActions}
                        onAddNew={handleAddNew}
                        onRefresh={handleRefresh}
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
                    title={t('Delete {{name}}', { name: deleteDialog.item?.name })}
                    description={t('Are you sure you want to delete this item? This action cannot be undone.')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>
        </AppLayout>
    );
}
