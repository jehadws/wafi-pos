import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, Edit, List, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table/data-table";
import ConfirmationDialog from "@/components/confirmation-dialog";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/format";
import axios from "axios";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Accounting", href: "/dashboard/accounting" },
  { title: "Transactions", href: "/dashboard/accounting/transactions" }
];

export default function Dashboard() {
  const [transaction, setTransaction] = useState<CustomPaginationData<Transaction>>({
    data: [],
    last_page: 1,
    current_page: 1,
    next_page_url: null,
    path: "http://127.0.0.1:8000/api/crud/ns.transactions",
    per_page: 20,
    prev_page_url: null,
    to: 0,
    total: 0,
    from: 0,
    last_page_url: "",
    first_page_url: ""
  });

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    loading: boolean
    item: TransactionAccount | null
  }>({
    isOpen: false,
    loading: false,
    item: null,
  })

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item || deleteDialog.loading) return;

    try {
      router.delete(`/api/crud/ns.transactions/${deleteDialog.item.id}`);
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

  const columns: ColumnDef<TransactionAccount>[] = [
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
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'transactions_accounts_name',
      header: 'Account Name',
    },
    {
      accessorKey: 'value',
      header: 'Value',
    },
    {
      accessorKey: 'recurring',
      header: 'Recurring',
    },
    {
      accessorKey: 'occurrence',
      header: 'Occurrence',
    },
    {
      accessorKey: 'user_username',
      header: 'Author',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        return formatDate(row.original.created_at);
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
                <List className="w-4 h-4 mr-2" />
                Options
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.get(`/dashboard/accounting/transactions/edit/${item.id}`)}>
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
      action: (selectedRows: TransactionAccount[]) => {
        const payload = {
          action: 'delete_selected',
          entries: selectedRows.map((row) => row.id),
        };

        // Get CSRF token from meta tag
        router
          .post('/api/crud/ns.transactions/bulk-actions', payload, {
            onError: (errors) => {
              toast.error('Operation failed');
              console.error('Error:', errors);
            },
            onSuccess: () => {
              toast.success('Successfully processed selected items');
              router.reload();
            }
          })
      },
    },
  ];

  const handleAddNew = () => {
    router.visit(route('ns.dashboard.transactions.create'));
  }

  const handleRefresh = () => {
    getOrders(currentPage, pageSize);
  }

  const getOrders = async (page: number, pageSize: number) => {
    try {
      const res = await axios.get(`/api/crud/ns.transactions?page=${page}&per_page=${pageSize}`, {
        params: { search: searchTerm },
      });
      console.log("accounts", res.data);
      setTransaction(res.data)
    } catch (error) {
      console.error("Error fetching Orders:", error);
    }
  }


  const handleSearch = (search: string) => {
    setSearchTerm(search)
    setCurrentPage(1) // Reset to first page when searching
  }


  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  useEffect(() => {
    getOrders(currentPage, pageSize);
  }, [currentPage, pageSize, searchTerm]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={"Transactions List - JGREM"} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={transaction}
            title="Transactions List"
            description="Display all transactions."
            searchKey="name"
            bulkActions={bulkActions}
            onAddNew={handleAddNew}
            onRefresh={handleRefresh}

            useCustomPagination
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}

            useServerSideSearch={true}
            onSearch={handleSearch}
            searchValue={searchTerm}
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





