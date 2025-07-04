import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, Edit, List, MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/ui/data-table/data-table";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Procurement Products", href: "/dashboard/procurements/products" }
];



export default function Dashboard() {
  const { title, products } = usePage<{ products: ProcurementProduct[], title: string }>().props;
  console.log(products)

  const columns: ColumnDef<ProcurementProduct>[] = [
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
      accessorKey: 'unit_name',
      header: 'Unit',
    },
    {
      accessorKey: 'procurement_name',
      header: 'Procurement',
    },
    {
      accessorKey: 'available_quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'total_purchase_price',
      header: 'Total Price',
    },
    {
      accessorKey: 'barcode',
      header: 'Barcode',
    },
    {
      accessorKey: 'author_name',
      header: 'Author',
    },
    {
      accessorKey: 'expiration_date',
      header: 'Expiration Date',
      cell: ({ row }) => {
        const value = row.getValue('expiration_date') as string;
        const date = new Date(value);
        return value ? date.toLocaleString('en-US', {
          dateStyle: 'medium',
        }) : 'N/A';
      },
    },
    {
      accessorKey: 'created_at',
      header: 'On',
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
              <DropdownMenuItem onClick={() => router.get(`/dashboard/procurements/products/edit/${item.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleRefresh = () => {
    router.reload();
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title || "Procurement Products List"} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={products}
            title="Procurement Products List"
            description="Display all procurement products."
            searchKey="name"
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </AppLayout>
  );
}


