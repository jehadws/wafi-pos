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
import { Badge } from "@/components/ui/badge";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Categories", href: "/dashboard/units" }
];



export default function Dashboard() {
  const { title, users } = usePage<{ users: Customer[], title: string }>().props;
  console.log(users);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    loading: boolean
    customer: Customer | null
  }>({
    isOpen: false,
    loading: false,
    customer: null,
  })

  const handleDeleteConfirm = async () => {
    console.log("delete", deleteDialog.customer);

    if (!deleteDialog.customer || deleteDialog.loading) return;

    try {
      router.delete(`/api/crud/ns.users/${deleteDialog.customer.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteDialog({
        ...deleteDialog,
        loading: false,
        isOpen: false,
        customer: null,
      })
    }
  }

  const columns: ColumnDef<Customer>[] = [
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
      accessorKey: 'username',
      header: 'Username',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.getValue('email'),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        return row?.getValue('active') ? <Badge variant="default">Active</Badge> : <Badge variant="outline">Inactive</Badge>
      }
    },
    {
      accessorKey: 'account_amount',
      header: 'Wallet',
    },
    {
      accessorKey: 'owed_amount',
      header: 'Owed Amount',
    },
    {
      accessorKey: 'purchases_amount',
      header: 'Purchases Amount',
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        return row?.getValue('roles').map((role: Role) => role.name).join(', ')
      }
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
              <DropdownMenuItem onClick={() => router.get(`/dashboard/users/edit/${product.id}`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>Orders</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>Rewards</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>Coupons</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { }}>Wallet History</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialog({ isOpen: true, loading: false, customer: row.original })}
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
      action: (selectedRows: Customer[]) => {
        const payload = {
          action: 'delete_selected',
          entries: selectedRows.map((row) => row.id),
        };

        // Get CSRF token from meta tag
        router
          .post('/api/crud/ns.users/bulk-actions', payload, {
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
    router.visit(route('ns.dashboard.users-create'));
  }

  const handleRefresh = () => {
    router.reload();
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title || "Category Products"} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={users}
            title="Users List"
            description="Display all users."
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
          title={`Delete ${deleteDialog.customer?.first_name}`}
          description="Are you sure you want to delete this customer? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          loading={deleteDialog.loading}
        />
      </div>
    </AppLayout>
  );
}

