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
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Edit, List, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products', href: '/dashboard/products' },
];

export default function Dashboard() {
    const { t } = useTranslation();
    const { products } = usePage<{ products: Product[] }>().props;
    const breadcrumbsWithTranslation = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Products'), href: '/dashboard/products' },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        item: Product | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            router.delete(`/api/crud/ns.products/${deleteDialog.item.id}`);
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

    const columns: ColumnDef<Product>[] = [
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
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
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
            cell: ({ row }) => row.getValue('type'),
        },
        {
            accessorKey: 'sku',
            header: t('SKU'),
        },
        {
            accessorKey: 'category_name',
            header: t('Category'),
        },
        {
            accessorKey: 'status',
            header: t('Status'),
        },
        {
            accessorKey: 'author_name',
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
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/products/edit/${item.id}`)}>
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
            action: (selectedRows: Product[]) => {
                const payload = {
                    action: 'delete_selected',
                    entries: selectedRows.map((row) => row.id),
                };

                router.post('/api/crud/ns.products/bulk-actions', payload, {
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
        router.visit(route('ns.dashboard.products.create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbsWithTranslation}>
            <Head title={'Products List - JGREM'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={products}
                        title={t('Products List')}
                        description={t('Display all products.')}
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
