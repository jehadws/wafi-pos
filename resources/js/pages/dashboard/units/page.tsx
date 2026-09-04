import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { unitsApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const { title, units } = usePage<{ units: Unit[]; title: string }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Units'), href: '/dashboard/units' },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        item: Unit | null;
    }>({
        isOpen: false,
        loading: false,
        item: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.item || deleteDialog.loading) return;

        try {
            await unitsApi.remove(deleteDialog.item.id);
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
                item: null,
            });
        }
    };

    const columns: ColumnDef<Unit>[] = [
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
            accessorKey: 'value',
            header: t('Value'),
            cell: ({ row }) => row.getValue('value'),
        },
        {
            accessorKey: 'base_unit',
            header: t('Base Unit'),
            cell: ({ row }) => (Number(row.getValue('base_unit')) == 1 ? t('Yes') : t('No')),
            filterFn: (row, id, value) => {
                return row.getValue(id) == value;
            },
        },
        {
            accessorKey: 'group_name',
            header: t('Group'),
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
                                <span className="sr-only">{t('Open menu')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('Options')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                <Copy className="me-2 h-4 w-4" />
                                {t('Copy ID')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                <Copy className="me-2 h-4 w-4" />
                                {t('Copy ID')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/units/edit/${item.id}`)}>
                                <Edit className="me-2 h-4 w-4" />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteDialog({ isOpen: true, loading: false, item: row.original })}
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
            action: async (selectedRows: Unit[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await unitsApi.bulkDelete(entries);
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
        router.visit(route('sb.dashboard.units.create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    const filterableColumns = [
        {
            id: 'base_unit',
            title: t('Base Unit'),
            options: [
                { label: t('Yes'), value: '1' },
                { label: t('No'), value: '0' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Category Products')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={units}
                        title={t('Units List')}
                        description={t('Display all units.')}
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
