import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table/data-table";
import { useState } from "react";
import ConfirmationDialog from "@/components/confirmation-dialog";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Categories", href: "/dashboard/units" }
];

export default function RewardSystemPage() {
  const { title, groups } = usePage<{ groups: CustomerGroup[], title: string }>().props;
  console.log(groups)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    loading: boolean
    group: CustomerGroup | null
  }>({
    isOpen: false,
    loading: false,
    group: null,
  })

  const handleDeleteConfirm = async () => {
    console.log("delete", deleteDialog.group);

    if (!deleteDialog.group || deleteDialog.loading) return;

    try {
      router.delete(`/api/crud/ns.customers-groups/${deleteDialog.group.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteDialog({
        ...deleteDialog,
        loading: false,
        isOpen: false,
        group: null,
      })
    }
  }

  const columns: ColumnDef<CustomerGroup>[] = [
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
      accessorKey: 'reward_name',
      header: 'Reward System',
      cell: ({ row }) => {
        // if the reward system is null, return an empty string
        if (!row.original.reward_system_id) return 'N/A';
        // otherwise, return the name of the reward system
        return row.original.reward_name;
      }
    },
    {
      accessorKey: 'author_name',
      header: 'Author',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        const value = row.getValue('created_at') as string;
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
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
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id.toString())}>Copy ID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.get(`/dashboard/customers/groups/edit/${product.id}`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialog({ isOpen: true, loading: false, group: row.original })}
                className="text-destructive"
              >
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
      action: (selectedRows: CustomerGroup[]) => {
        const payload = {
          action: 'delete_selected',
          entries: selectedRows.map((row) => row.id),
        };

        // Get CSRF token from meta tag
        router
          .post('/api/crud/ns.customers-groups/bulk-actions', payload, {
            onError: (errors) => {
              toast.error('Operation failed');
              console.error('Error:', errors);
            },
            onSuccess: () => {
              toast.success('Successfully processed selected');
              router.reload();
            }
          })
      },
    },
  ];

  const handleAddNew = () => {
    router.visit(route("ns.dashboard.customersgroups-create"));
  }

  const handleRefresh = () => {
    router.reload();
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title || "Coupons List"} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={groups}
            title="Customer Groups List"
            description="Display all Customers Groups."
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
          title={`Delete ${deleteDialog.group?.name}`}
          description="Are you sure you want to delete this Customer Group? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          loading={deleteDialog.loading}
        />
      </div>
    </AppLayout>
  );
}

