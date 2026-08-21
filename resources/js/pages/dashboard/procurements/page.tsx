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
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Edit, FileCheck, List, MoreHorizontal, ReceiptText, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const { title, procurements } = usePage<{ procurements: Procurement[]; title: string }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Procurements'), href: '/dashboard/procurements' },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        item: Procurement | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            router.delete(`/api/crud/ns.procurements/${deleteDialog.item.id}`);
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

    const columns: ColumnDef<Procurement>[] = [
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
            accessorKey: 'provider_name',
            header: t('Provider'),
        },
        {
            accessorKey: 'delivery_status',
            header: t('Delivery Status'),
        },
        {
            accessorKey: 'payment_status',
            header: t('Payment Status'),
        },
        {
            accessorKey: 'invoice_date',
            header: t('Invoice Date'),
        },
        {
            accessorKey: 'value',
            header: t('Sale Value'),
        },
        {
            accessorKey: 'cost',
            header: t('Purchase Value'),
        },
        {
            accessorKey: 'tax_value',
            header: t('Tax Value'),
        },
        {
            accessorKey: 'author_name',
            header: t('Author'),
        },
        {
            accessorKey: 'provider_name',
            header: t('Provider'),
        },
        {
            accessorKey: 'delivery_status',
            header: t('Delivery Status'),
        },
        {
            accessorKey: 'payment_status',
            header: t('Payment Status'),
        },
        {
            accessorKey: 'invoice_date',
            header: t('Invoice Date'),
        },
        {
            accessorKey: 'value',
            header: t('Sale Value'),
        },
        {
            accessorKey: 'cost',
            header: t('Purchase Value'),
        },
        {
            accessorKey: 'tax_value',
            header: t('Tax Value'),
        },
        {
            accessorKey: 'author_name',
            header: t('Author'),
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
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/procurements/edit/${item.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                <ReceiptText className="mr-2 h-4 w-4" />
                                {t('Invoice')}
                            </DropdownMenuItem>
                            {item.payment_status === 'unpaid' && (
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    {t('Set Paid')}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => toast.success(t("The refresh process has started. You'll get informed once it's complete."))}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t('Refresh')}
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
            action: (selectedRows: Procurement[]) => {
                const payload = {
                    action: 'delete_selected',
                    entries: selectedRows.map((row) => row.id),
                };

                router.post('/api/crud/ns.procurements/bulk-actions', payload, {
                    onError: (errors) => {
                        toast.error(t('Operation failed'));
                        console.error('Error:', errors);
                    },
                    onSuccess: () => {
                        toast.success(t('Selected items deleted successfully'));
                        router.reload();
                    },
                });
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('ns.dashboard.procurement-create'));
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
                        data={procurements}
                        title={t('Procurements List')}
                        description={t('Display all procurements.')}
                        searchKey="name"
                        bulkActions={bulkActions}
                        onAddNew={handleAddNew}
                        onRefresh={handleRefresh}
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
