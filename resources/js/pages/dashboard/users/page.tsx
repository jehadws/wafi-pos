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
import { usersApi } from '@/api';
import { getApiErrorMessage } from '@/utils/api-errors';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
    const { t } = useTranslation();
    const { title, users } = usePage<{ users: Customer[]; title: string }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Users'), href: '/dashboard/users' },
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

        setDeleteDialog(prev => ({ ...prev, loading: true }));

        try {
            await usersApi.remove(deleteDialog.customer.id);
            toast.success(t('User deleted successfully'));
            setDeleteDialog({ isOpen: false, loading: false, customer: null });
            router.reload();
        } catch (err) {
            toast.error(t('Failed to delete user'));
            console.error(err);
            setDeleteDialog(prev => ({ ...prev, loading: false }));
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
            accessorKey: 'username',
            header: t('Username'),
        },
        {
            accessorKey: 'email',
            header: t('Email'),
            cell: ({ row }) => row.getValue('email'),
        },
        {
            accessorKey: 'active',
            header: t('Status'),
            cell: ({ row }) => {
                return row?.getValue('active') ? <Badge variant="default">{t('Active')}</Badge> : <Badge variant="outline">{t('Inactive')}</Badge>;
            },
        },
        {
            accessorKey: 'account_amount',
            header: t('Wallet'),
        },
        {
            accessorKey: 'owed_amount',
            header: t('Owed Amount'),
        },
        {
            accessorKey: 'purchases_amount',
            header: t('Purchases Amount'),
        },
        {
            accessorKey: 'roles',
            header: t('Roles'),
            cell: ({ row }) => {
                return (row
                    ?.getValue('roles') as Role[])
                    .map((role: Role) => role.name)
                    .join(', ');
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
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/users/edit/${product.id}`)}>{t('Edit')}</DropdownMenuItem>
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
            label: t('Delete Selected'),
            action: async (selectedRows: Customer[]) => {
                const entries = selectedRows.map((row) => row.id);

                try {
                    await usersApi.bulkDelete(entries);
                    toast.success(t('Successfully processed selected roles'));
                    router.reload();
                } catch (errors) {
                    toast.error(getApiErrorMessage(errors, t('Operation failed')));
                    console.error('Error:', errors);
                }
            },
        },
    ];

    const handleAddNew = () => {
        router.visit(route('sb.dashboard.users-create'));
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Category Products')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={users}
                        title={t('Users List')}
                        description={t('Display all users.')}
                        searchKey="username"
                        bulkActions={bulkActions}
                        onAddNew={handleAddNew}
                        onRefresh={handleRefresh}
                    />
                </div>

                <ConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, loading: false, customer: null })}
                    onConfirm={handleDeleteConfirm}
                    title={t('Delete {{name}}', { name: deleteDialog.customer?.first_name ?? '' })}
                    description={t('Are you sure you want to delete this customer? This action cannot be undone.')}
                    confirmText={t('Delete')}
                    cancelText={t('Cancel')}
                    variant="destructive"
                    loading={deleteDialog.loading}
                />
            </div>
        </AppLayout>
    );
}
