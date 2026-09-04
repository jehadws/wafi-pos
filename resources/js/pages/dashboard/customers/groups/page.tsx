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
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RewardSystemPage() {
    const { t } = useTranslation();
    const { title, groups } = usePage<{ groups: CustomerGroup[]; title: string }>().props;
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        loading: boolean;
        group: CustomerGroup | null;
    }>({
        isOpen: false,
        loading: false,
        group: null,
    });

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.group || deleteDialog.loading) return;

        try {
            await customersApi.removeGroup(deleteDialog.group.id);
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
                group: null,
            });
        }
    };

    const columns: ColumnDef<CustomerGroup>[] = [
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
            accessorKey: 'reward_name',
            header: t('Reward System'),
            cell: ({ row }) => {
                if (!row.original.reward_system_id) return t('N/A');
                return row.original.reward_name;
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
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/customers/groups/edit/${product.id}`)}>
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteDialog({ isOpen: true, loading: false, group: row.original })}
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
            action: async (selectedRows: CustomerGroup[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await customersApi.bulkDeleteGroups(entries);
                    toast.success(t('Successfully processed selected'));
                    router.reload();
                } catch (error) {
                    toast.error(getApiErrorMessage(error, t('Operation failed')));
                    console.error('Error:', error);
                }
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('sb.dashboard.customersgroups-create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Customer Groups'), href: '/dashboard/customers/groups' },
            ]}
        >
            <Head title={title || t('Customer Groups List')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={groups}
                        title={t('Customer Groups List')}
                        description={t('Display all Customers Groups.')}
                        searchKey="name"
                        bulkActions={bulkActions}
                        onAddNew={handleAddNew}
                        onRefresh={handleRefresh}
                    />
                </div>

                <ConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, loading: false, group: null })}
                    onConfirm={handleDeleteConfirm}
                    title={`${t('Delete')} ${deleteDialog.group?.name}`}
                    description={t('Are you sure you want to delete this Customer Group? This action cannot be undone.')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>
        </AppLayout>
    );
}
