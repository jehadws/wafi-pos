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
import { providersApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const { title, providers } = usePage<{ providers: Provider[]; title: string }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Providers'), href: '/dashboard/providers' },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        provider: Provider | null;
    }>({
        isOpen: false,
        loading: false,
        provider: null,
    });

    const handleDeleteConfirm = async () => {

        if (!deleteDialog.provider || deleteDialog.loading) return;

        try {
            await providersApi.remove(deleteDialog.provider.id);
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
                provider: null,
            });
        }
    };

    const columns: ColumnDef<Provider>[] = [
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
            accessorKey: 'first_name',
            header: t('First Name'),
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
            accessorKey: 'amount_due',
            header: t('Amount Due'),
        },
        {
            accessorKey: 'amount_paid',
            header: t('Amount Paid'),
        },
        {
            accessorKey: 'author',
            header: t('Author'),
        },
        {
            accessorKey: 'created_at',
            header: t('Created At'),
            cell: ({ row }) => {
                return formatDateTime(row.getValue('created_at'));
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('Open menu')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('Options')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id.toString())}>{t('Copy ID')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/providers/edit/${product.id}`)}>{t('Edit')}</DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteDialog({ isOpen: true, loading: false, provider: row.original })}
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
            label: t('Delete Selected'),
            action: async (selectedRows: Provider[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await providersApi.bulkDelete(entries);
                    toast.success(t('Successfully processed selected roles'));
                    router.reload();
                } catch (error) {
                    toast.error(getApiErrorMessage(error, t('Operation failed')));
                    console.error('Error:', error);
                }
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('sb.dashboard.providers.create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title || t('Category Products')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={providers}
                        title={t('Providers List')}
                        description={t('Display all providers.')}
                        searchKey="first_name"
                        bulkActions={bulkActions}
                        onAddNew={handleAddNew}
                        onRefresh={handleRefresh}
                    />
                </div>

                <ConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, loading: false, provider: null })}
                    onConfirm={handleDeleteConfirm}
                    title={t('Delete {{name}}', { name: deleteDialog.provider?.first_name })}
                    description={t('Are you sure you want to delete this provider? This action cannot be undone.')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>
        </AppLayout>
    );
}
