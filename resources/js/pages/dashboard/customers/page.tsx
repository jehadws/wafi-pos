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
import { customersApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const { title, customers } = usePage<{ customers: Customer[]; title: string }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customers'), href: '/dashboard/customers' },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        customer: Customer | null;
    }>({
        isOpen: false,
        loading: false,
        customer: null,
    });

    const handleDeleteConfirm = async () => {

        if (!deleteDialog.customer || deleteDialog.loading) return;

        try {
            await customersApi.remove(deleteDialog.customer.id);
            toast.success(t('Successfully deleted selected item'));
            router.reload();
        } catch (error) {
            toast.error(getApiErrorMessage(error, t('Operation failed')));
            console.error(error);
        } finally {
            setDeleteDialog({
                ...deleteDialog,
                loading: false,
                isOpen: false,
                customer: null,
            });
        }
    };

    const columns: ColumnDef<Customer>[] = [
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
            cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
        },
        {
            accessorKey: 'email',
            header: t('Email'),
            cell: ({ row }) => row.getValue('email'),
        },
        {
            accessorKey: 'phone',
            header: t('Phone'),
        },
        {
            accessorKey: 'account_amount',
            header: t('Account Credit'),
        },
        {
            accessorKey: 'owed_amount',
            header: t('Owed Amount'),
        },
        {
            accessorKey: 'purchases_amount',
            header: t('Purchase Amount'),
        },
        {
            accessorKey: 'author_name',
            header: t('Author'),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('Options')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/customers/edit/${product.id}`)}>{t('Edit')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>{t('Orders')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>{t('Rewards')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>{t('Coupons')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>{t('Wallet History')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteDialog({ isOpen: true, loading: false, customer: row.original })}
                                className="text-destructive"
                            >
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
            label: t('Delete Selected Customers'),
            action: async (selectedRows: Customer[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await customersApi.bulkDelete(entries);
                    toast.success(t('Successfully processed selected items'));
                    router.reload();
                } catch (error) {
                    toast.error(getApiErrorMessage(error, t('Operation failed')));
                    console.error('Error:', error);
                }
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('sb.dashboard.customers-create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title || 'Category Products'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={customers}
                        title={t('Customers List')}
                        description={t('Display all customers.')}
                        searchKey="name"
                        bulkActions={bulkActions}
                        onAddNew={handleAddNew}
                        onRefresh={handleRefresh}
                    />
                </div>

                <ConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, loading: false, customer: null })}
                    onConfirm={handleDeleteConfirm}
                    title={`${t('Delete')} ${deleteDialog.customer?.first_name}`}
                    description={t('Would you like to delete this customer ?')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>
        </AppLayout>
    );
}
