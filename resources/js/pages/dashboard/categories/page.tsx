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
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Categories', href: '/dashboard/products/categories' },
];


export default function Dashboard() {
  const { title, categories } = usePage<{ categories: CategoryProduct[]; title: string }>().props;
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    loading: boolean
    item: CategoryProduct | null
  }>({
    isOpen: false,
    loading: false,
    item: null,
  })

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
      })
    }
  }

  const columns: ColumnDef<CategoryProduct>[] = [
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
      header: 'Name',
    },
    {
      accessorKey: 'parent_id',
      header: 'Parent',
      cell: ({ row }) => (row.original.parent_id === null || row.original.parent_id === 0)
        ? 'No Parent'
        : categories.find(c => c.id === row.original.parent_id)?.name,
    },
    {
      accessorKey: 'total_items',
      header: 'Total Products',
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
      header: 'Displays On POS',
      cell: ({ row }) => (Number(row.getValue('displays_on_pos')) == 1 ? 'Yes' : 'No'),
      filterFn: (row, id, value) => {
        return row.getValue(id) == value;
      },
    },
    {
      accessorKey: 'author_name',
      header: 'Author',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        return formatDateTime(row.getValue('created_at'))
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
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.get(`/dashboard/products/categories/edit/${item.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialog({ isOpen: true, loading: false, item: row.original })}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const bulkActions = [
    {
      label: 'Delete Selected',
      action: (selectedRows: CategoryProduct[]) => {
        const payload = {
          action: 'delete_selected',
          entries: selectedRows.map((row) => row.id),
        };

        router
          .post('/api/crud/ns.products-categories/bulk-actions', payload, {
            onError: (errors) => {
              toast.error('Operation failed');
              console.error('Error:', errors);
            },
            onSuccess: () => {
              toast.success('Successfully processed selected roles');
              router.reload();
            }
          })
      },
    },
  ];

  const handleAddNew = () => {
    router.visit(route('ns.dashboard.products.categories.create'));
  }

  const handleRefresh = () => {
    router.reload();
  }

  const filterableColumns = [
    {
      id: 'displays_on_pos',
      title: 'POS Display',
      options: [
        { label: 'Yes', value: "1" },
        { label: 'No', value: "0" },
      ],
    },
    {
      id: 'total_items',
      title: 'Total Products',
      options: [
        { label: '0 Products', value: '0' },
        { label: '1-10 Products', value: '1-10' },
        { label: '10+ Products', value: '10+' },
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
            title="Category Products List"
            description="Display all category products."
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
          title={`Delete ${deleteDialog.item?.name}`}
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          loading={deleteDialog.loading}
        />
      </div>
    </AppLayout>
  );
}

