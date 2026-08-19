import ConfirmationDialog from '@/components/confirmation-dialog';
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
import { crudApi } from '@/api';
import { List, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
        { title: t('Transactions History'), href: '/dashboard/accounting/transactions/history' },
    ];

    const [transaction, setTransaction] = useState<CustomPaginationData<TransactionHistory>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: 'http://127.0.0.1:8000/api/crud/ns.transactions-history',
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
        item: TransactionHistory | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            router.delete(`/api/crud/ns.transactions-history/${deleteDialog.item.id}`);
        } catch (error) {
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

    const columns: ColumnDef<TransactionHistory>[] = [
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
            accessorKey: 'operation',
            header: t('Operation'),
        },
        {
            accessorKey: 'value',
            header: t('Value'),
        },
        {
            accessorKey: 'occurrence',
            header: t('Occurrence'),
        },
        {
            accessorKey: 'users_username',
            header: t('Author'),
        },
        {
            accessorKey: 'trigger_date',
            header: t('Created At'),
            cell: ({ row }) => {
                return formatDate(row.original.trigger_date);
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('Open menu')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="inline-flex items-center">
                                <List className="mr-2 h-4 w-4" />
                                {t('Options')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
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
            action: (selectedRows: TransactionHistory[]) => {
                const payload = {
                    action: 'delete_selected',
                    entries: selectedRows.map((row) => row.id),
                };

                router.post('/api/crud/ns.transactions-history/bulk-actions', payload, {
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

    const handleRefresh = () => {
        getOrders(currentPage, pageSize);
    };

    const getOrders = async (page: number, pageSize: number) => {
        try {
            const history = await crudApi.list('ns.transactions-history', { page, per_page: pageSize, search: searchTerm });
            setTransaction(history);
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
            <Head title={t('Transactions History List') + ' - JGREM'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={transaction}
                        title={t('Transactions History List')}
                        description={t('Display all transaction history.')}
                        searchKey="name"
                        bulkActions={bulkActions}
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
                    title={`${t('Delete')} ${deleteDialog.item?.name}`}
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
