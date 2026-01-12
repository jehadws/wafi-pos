import ConfirmationDialog from '@/components/confirmation-dialog';
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
import { formatDateTime } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { Edit, List, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Payment Types'), href: '/dashboard/orders/payments-types' },
    ];

    const [paymentTypes, setPaymentTypes] = useState<CustomPaginationData<PaymentType>>({
        data: [],
        last_page: 1,
        current_page: 1,
        next_page_url: null,
        path: 'http://127.0.0.1:8000/api/crud/ns.payments-types',
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
        item: PaymentType | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            router.delete(`/api/crud/ns.payments-types/${deleteDialog.item.id}`);
        } catch (error) {
            console.error(error);
        } finally {
            handleRefresh();
            setDeleteDialog({
                ...deleteDialog,
                loading: false,
                isOpen: false,
                item: null,
            });
        }
    };

    const columns: ColumnDef<PaymentType>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label={t('Select row')} />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'identifier',
            header: t('Identifier'),
        },
        {
            accessorKey: 'label',
            header: t('Label'),
        },
        {
            accessorKey: 'active',
            header: t('Active'),
            cell: ({ row }) => {
                const variant = () => {
                    switch (row.getValue('active')) {
                        case 'Yes':
                            return 'success';
                        case 'No':
                            return 'danger';
                    }
                };
                return <Badge variant={variant()}>{row.getValue('active')}</Badge>;
            },
        },
        {
            accessorKey: 'priority',
            header: t('Priority'),
        },
        {
            accessorKey: 'user_username',
            header: t('Author'),
        },
        {
            accessorKey: 'readonly',
            header: t('Readonly'),
        },
        {
            accessorKey: 'created_at',
            header: t('Created On'),
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
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/orders/payments-types/edit/${item.id}`)}>
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
            action: (selectedRows: PaymentType[]) => {
                const payload = {
                    action: 'delete_selected',
                    entries: selectedRows.map((row) => row.id),
                };

                router.post('/api/crud/ns.payments-types/bulk-actions', payload, {
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
        router.visit(route('ns.dashboard.orders-create-types'));
    };

    const handleRefresh = () => {
        getOrders(currentPage, pageSize);
    };

    const getOrders = async (page: number, pageSize: number) => {
        try {
            const res = await axios.get(`/api/crud/ns.payments-types?page=${page}&per_page=${pageSize}`, {
                params: { search: searchTerm },
            });

            setPaymentTypes(res.data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const handleSearch = (search: string) => {
        setSearchTerm(search);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    useEffect(() => {
        getOrders(currentPage, pageSize);
    }, [currentPage, pageSize, searchTerm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Payment Types List')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={paymentTypes}
                        bulkActions={bulkActions}
                        title={t('Payment Types List')}
                        onAddNew={handleAddNew}
                        description={t('Display all payment types.')}
                        searchKey="label"
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
                    title={t('Delete {identifier}', { identifier: deleteDialog.item?.identifier })}
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
