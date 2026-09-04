import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { crudApi, cashRegistersApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { Edit, List, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type RegisterRow = {
    id: number;
    name: string;
    status: string;
    cashier_username?: string | null;
    balance: number | string;
    user_username: string;
    created_at: string;
};

export default function CashRegistersList() {
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Cash Registers'), href: '/dashboard/cash-registers' },
    ];

    const [registers, setRegisters] = useState<CustomPaginationData<RegisterRow>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: '/api/crud/sb.cash-registers',
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
        item: RegisterRow | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const fetchData = async (page: number, size: number, search: string) => {
        try {
            const data = await crudApi.list<CustomPaginationData<RegisterRow>>('sb.cash-registers', {
                page,
                per_page: size,
                search,
            });
            setRegisters(data);
        } catch (error) {
            console.error('Failed to load cash registers:', error);
        }
    };

    useEffect(() => {
        fetchData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm]);

    const handleRefresh = () => {
        fetchData(currentPage, pageSize, searchTerm);
    };

    const handleAddNew = () => {
        router.visit('/dashboard/cash-registers/create');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            await crudApi.remove('sb.cash-registers', deleteDialog.item.id);
            toast.success(t('The item has been successfully deleted.'));
        } catch (error) {
            console.error(error);
            toast.error(getApiErrorMessage(error, t('Operation failed')));
        } finally {
            handleRefresh();
            setDeleteDialog({ isOpen: false, loading: false, item: null });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'opened':
                return <Badge variant="success">{t('Opened')}</Badge>;
            case 'closed':
                return <Badge variant="info">{t('Closed')}</Badge>;
            case 'in-use':
                return <Badge variant="default">{t('In Use')}</Badge>;
            case 'disabled':
            default:
                return <Badge variant="danger">{t('Disabled')}</Badge>;
        }
    };

    const columns: ColumnDef<RegisterRow>[] = [
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
            accessorKey: 'status',
            header: t('Status'),
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: 'cashier_username',
            header: t('Used By'),
            cell: ({ row }) => row.original.cashier_username || t('N/A'),
        },
        {
            accessorKey: 'balance',
            header: t('Balance'),
            cell: ({ row }) => formatCurrency(parseFloat(String(row.original.balance)) || 0),
        },
        {
            accessorKey: 'user_username',
            header: t('Author'),
        },
        {
            accessorKey: 'created_at',
            header: t('Created At'),
            cell: ({ row }) => formatDateTime(row.getValue('created_at')),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const item = row.original;

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
                                <List className="me-2 h-4 w-4" />
                                {t('Options')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/cash-registers/edit/${item.id}`)}>
                                <Edit className="me-2 h-4 w-4" />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteDialog({ isOpen: true, loading: false, item })}
                                disabled={item.status === 'opened'}
                                className="text-destructive"
                            >
                                <Trash2 className="text-destructive me-2 h-4 w-4" />
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
            action: async (selectedRows: RegisterRow[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await cashRegistersApi.bulkDelete(entries);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Registers List')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={registers as unknown as RegisterRow[]}
                        bulkActions={bulkActions}
                        title={t('Registers List')}
                        onAddNew={handleAddNew}
                        description={t('Display all registers.')}
                        searchKey="name"
                        onRefresh={handleRefresh}
                        useCustomPagination
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                        useServerSideSearch={true}
                        onSearch={(search) => {
                            setSearchTerm(search);
                            setCurrentPage(1);
                        }}
                        searchValue={searchTerm}
                    />
                </div>

                <ConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, loading: false, item: null })}
                    onConfirm={handleDeleteConfirm}
                    title={t('Delete {name}', { name: deleteDialog.item?.name ?? '' })}
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
