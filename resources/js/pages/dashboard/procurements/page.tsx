import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, Delete, Edit, FileCheck, List, MoreHorizontal, Option, ReceiptText, RefreshCw, Trash, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table/data-table";
import { useState } from "react";
import ConfirmationDialog from "@/components/confirmation-dialog";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Procurements", href: "/dashboard/procurements" }
];



export default function Dashboard() {
  const { title, procurements } = usePage<{ procurements: Procurement[], title: string }>().props;
  console.log(procurements)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    loading: boolean
    item: Procurement | null
  }>({
    isOpen: false,
    loading: false,
    item: null,
  })

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
      })
    }
  }

  const columns: ColumnDef<Procurement>[] = [
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
      accessorKey: 'provider_name',
      header: 'Provider',
    },
    {
      accessorKey: 'delivery_status',
      header: 'Delivery status',
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment status',
    },
    {
      accessorKey: 'invoice_date',
      header: 'Invoice Date',
    },
    {
      accessorKey: 'value',
      header: 'Sale Value',
    },
    {
      accessorKey: 'cost',
      header: 'Purchase Value',
    },
    {
      accessorKey: 'tax_value',
      header: 'Tax Value',
    },
    {
      accessorKey: 'author_name',
      header: 'Author',
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
                <List className="w-4 h-4 mr-2" />
                Options
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.get(`/dashboard/procurements/edit/${item.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                <ReceiptText className="w-4 h-4 mr-2" />
                Invoice
              </DropdownMenuItem>
              {item.payment_status === "unpaid" && <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                <FileCheck className="w-4 h-4 mr-2" />
                Set Paid</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => toast.success("The refresh process has started. You'll get informed once it's complete.")}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh</DropdownMenuItem>
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
      action: (selectedRows: Procurement[]) => {
        const payload = {
          action: 'delete_selected',
          entries: selectedRows.map((row) => row.id),
        };

        router
          .post('/api/crud/ns.procurements/bulk-actions', payload, {
            onError: (errors) => {
              toast.error('Operation failed');
              console.error('Error:', errors);
            },
            onSuccess: () => {
              toast.success('Selected items deleted successfully');
              router.reload();
            }
          })
      },
    },
  ];

  const handleAddNew = () => {
    router.visit(route('ns.dashboard.procurement-create'));
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
            data={procurements}
            title="Procurements List"
            description="Display all procurements."
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


