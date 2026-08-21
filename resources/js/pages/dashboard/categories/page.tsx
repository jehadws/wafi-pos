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
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const { title, categories } = usePage<{ categories: CategoryProduct[]; title: string }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Category Products'), href: '/dashboard/products/categories' },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        item: CategoryProduct | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            router.delete(`/api/crud/ns.products-categories/${deleteDialog.item.id}`);
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

    const columns: ColumnDef<CategoryProduct>[] = [
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
            accessorKey: 'parent_id',
            header: t('Parent'),
            cell: ({ row }) =>
                row.original.parent_id === null || row.original.parent_id === 0
                    ? t('No Parent')
                    : categories.find((c) => c.id === row.original.parent_id)?.name,
        },
        {
            accessorKey: 'total_items',
            header: t('Total Products'),
            cell: ({ row }) => row.getValue('total_items'),
            filterFn: (row, id, value) => {
                const numValue = Number(row.getValue(id));
                return value.some((value: string) => {
                    if (value === '1-10') {
                        return numValue >= 1 && numValue <= 10;
                    } else if (value === '10+') {
                        return numValue >= 10;
                    } else {
                        return String(row.getValue(id)) === value;
                    }
                });
            },
        },
        {
            accessorKey: 'displays_on_pos',
            header: t('Displays On POS'),
            cell: ({ row }) => (Number(row.getValue('displays_on_pos')) == 1 ? t('Yes') : t('No')),
            filterFn: (row, id, value) => {
                return row.getValue(id) == value;
            },
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
                            <DropdownMenuLabel>{t('Options')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('Copy ID')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/products/categories/edit/${item.id}`)}>
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
            action: (selectedRows: CategoryProduct[]) => {
                const payload = {
                    action: 'delete_selected',
                    entries: selectedRows.map((row) => row.id),
                };

                router.post('/api/crud/ns.products-categories/bulk-actions', payload, {
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
        router.visit(route('ns.dashboard.products.categories.create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    const filterableColumns = [
        {
            id: 'displays_on_pos',
            title: t('POS Display'),
            options: [
                { label: t('Yes'), value: '1' },
                { label: t('No'), value: '0' },
            ],
        },
        {
            id: 'total_items',
            title: t('Total Products'),
            options: [
                { label: t('0 Products'), value: '0' },
                { label: t('1-10 Products'), value: '1-10' },
                { label: t('10+ Products'), value: '10+' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={(title as string) || 'Category Products'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={categories}
                        title={t('Category Products List')}
                        description={t('Display all category products.')}
                        searchKey="name"
                        filterableColumns={filterableColumns}
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
                    description={t('Would you like to delete this item ?')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>
        </AppLayout>
    );
}
