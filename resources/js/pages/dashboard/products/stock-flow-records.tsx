import { Checkbox } from "@/components/ui/checkbox";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table/data-table";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/format";
import axios from "axios";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Accounting", href: "/dashboard/accounting" },
  { title: "Transactions", href: "/dashboard/accounting/transactions" },
  { title: "Transactions History", href: "/dashboard/accounting/transactions/history" }
];

export default function Dashboard() {
  const [transaction, setTransaction] = useState<CustomPaginationData<GlobalProductHistory>>({
    data: [],
    last_page: 1,
    current_page: 1,
    next_page_url: null,
    path: "http://127.0.0.1:8000/api/crud/ns.global-products-history",
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

  const columns: ColumnDef<GlobalProductHistory>[] = [
    {
      accessorKey: 'product_name',
      header: 'Product',
    },
    {
      accessorKey: 'procurement_name',
      header: 'Procurement',
    },
    {
      accessorKey: 'order_code',
      header: 'Order',
    },
    {
      accessorKey: 'operation_type',
      header: 'Operation Type',
    },
    {
      accessorKey: 'unit_name',
      header: 'Unit',
    },
    {
      accessorKey: 'before_quantity',
      header: 'Initial Quantity',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'after_quantity',
      header: 'New Quantity',
    },
    {
      accessorKey: 'total_price',
      header: 'Total Price',
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
  ];

  const handleRefresh = () => {
    getOrders(currentPage, pageSize);
  }

  const getOrders = async (page: number, pageSize: number) => {
    try {
      const res = await axios.get(`/api/crud/ns.global-products-history?page=${page}&per_page=${pageSize}`, {
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
      <Head title={"Product Histories - JGREM"} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={transaction}
            title="Product Histories"
            description="Display all product stock flow."
            searchKey="name"
            onRefresh={handleRefresh}

            useCustomPagination
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}

            useServerSideSearch={true}
            onSearch={handleSearch}
            searchValue={searchTerm}
          />
        </div>

      </div>
    </AppLayout>
  );
}





