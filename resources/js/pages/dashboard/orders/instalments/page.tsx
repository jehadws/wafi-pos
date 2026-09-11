import { crudApi } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatDateTime } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

type InstalmentRow = {
  id: number;
  order_id: number;
  order_code: string;
  customer_name: string;
  amount: number;
  date: string;
  paid: boolean;
};

export default function InstalmentsList() {
  const { t } = useTranslation();
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Orders'), href: '/dashboard/orders' },
    { title: t('Instalments'), href: '/dashboard/orders/instalments' },
  ];

  const [rows, setRows] = useState<CustomPaginationData<InstalmentRow>>({
    data: [],
    last_page: 1,
    current_page: 1,
    next_page_url: null,
    path: '/api/crud/sb.orders-instalments',
    per_page: 20,
    prev_page_url: null,
    to: 0,
    total: 0,
    from: 0,
    last_page_url: '',
    first_page_url: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page: number, size: number, search: string) => {
    try {
      const data = await crudApi.list<CustomPaginationData<InstalmentRow>>('sb.orders-instalments', {
        page,
        per_page: size,
        search,
      });
      setRows(data);
    } catch (err) {
      console.error('Failed to load instalments:', err);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize, searchTerm);
  }, [currentPage, pageSize, searchTerm]);

  const columns: ColumnDef<InstalmentRow>[] = [
    {
      accessorKey: 'customer_name',
      header: t('Customer'),
    },
    {
      accessorKey: 'order_code',
      header: t('Order'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span>{row.original.order_code}</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => router.get(`/dashboard/orders`)} title={t('View Order')}>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: t('Amount'),
      cell: ({ row }) => row.original.amount,
    },
    {
      accessorKey: 'date',
      header: t('Due Date'),
      cell: ({ row }) => formatDateTime(row.original.date),
    },
    {
      accessorKey: 'paid',
      header: t('Status'),
      cell: ({ row }) => {
        const isPaid = row.original.paid === true;
        const dueDate = new Date(row.original.date);
        const isOverdue = !isPaid && dueDate < new Date();
        if (isPaid) return <Badge variant="success">{t('Paid')}</Badge>;
        if (isOverdue) return <Badge variant="danger">{t('Overdue')}</Badge>;
        return <Badge variant="info">{t('Upcoming')}</Badge>;
      },
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Order Instalments')} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">
          <DataTable
            columns={columns}
            data={rows as unknown as InstalmentRow[]}
            title={t('Order Instalments')}
            description={t('List of all scheduled instalments across orders.')}
            searchKey="order_code"
            useCustomPagination
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            useServerSideSearch
            onSearch={(s) => {
              setSearchTerm(s);
              setCurrentPage(1);
            }}
            searchValue={searchTerm}
            onRefresh={() => fetchData(currentPage, pageSize, searchTerm)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
