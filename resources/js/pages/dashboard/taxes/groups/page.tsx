import { taxesApi } from '@/api';
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
import { getApiErrorMessage } from '@/utils/api-errors';
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RewardSystemPage() {
  const { t } = useTranslation();
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Taxes Groups'), href: '/dashboard/taxes/groups' },
  ];
  const { groups } = usePage<{ groups: RewardSystem[]; title: string }>().props;
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    loading: boolean;
    item: RewardSystem | null;
  }>({
    isOpen: false,
    loading: false,
    item: null,
  });

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item || deleteDialog.loading) return;

    try {
      await taxesApi.removeGroup(deleteDialog.item.id);
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

  const columns: ColumnDef<RewardSystem>[] = [
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
              <DropdownMenuItem onClick={() => router.get(`/dashboard/taxes/groups/edit/${product.id}`)}>{t('Edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteDialog({ isOpen: true, loading: false, item: row.original })} className="text-destructive">
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
      action: async (selectedRows: RewardSystem[]) => {
        const entries = selectedRows.map((row) => row.id);

        try {
          await taxesApi.bulkDeleteGroups(entries);
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
    router.visit(route('sb.dashboard.taxes.groups.create'));
  };

  const handleRefresh = () => {
    router.reload();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Taxes Groups List')} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={groups}
            title={t('Taxes Groups List')}
            description={t('Display all taxes groups.')}
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
          description={t('Are you sure you want to delete this Tax Group? This action cannot be undone.')}
          confirmText={t('Delete')}
          cancelText={t('Cancel')}
          variant="destructive"
          loading={deleteDialog.loading}
        />
      </div>
    </AppLayout>
  );
}
