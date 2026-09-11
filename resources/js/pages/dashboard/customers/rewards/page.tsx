import { customersApi } from '@/api';
import { DataTable } from '@/components/ui/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { getApiErrorMessage } from '@/utils/api-errors';
import { formatDateTime } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type PageProps = {
  customer: {
    id: number;
    first_name: string;
    last_name: string;
  };
};

export default function CustomerRewardsPage() {
  const { t } = useTranslation();
  const { customer } = usePage<PageProps>().props;
  const customerName = `${customer.first_name} ${customer.last_name}`.trim();

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Customers'), href: '/dashboard/customers' },
    { title: customerName, href: `/dashboard/customers/edit/${customer.id}` },
    { title: t('Rewards'), href: `/dashboard/customers/${customer.id}/rewards` },
  ];

  const [rewards, setRewards] = useState<CustomPaginationData<CustomerReward>>({
    data: [],
    last_page: 1,
    current_page: 1,
    next_page_url: null,
    path: '',
    per_page: 20,
    prev_page_url: null,
    to: 0,
    total: 0,
    from: 0,
    last_page_url: '',
    first_page_url: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadRewards = async (page: number) => {
    setIsLoading(true);
    try {
      setRewards(await customersApi.getCustomerRewards(customer.id, page));
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, t('An unexpected error occurred.')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRewards(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const columns: ColumnDef<CustomerReward>[] = [
    {
      accessorKey: 'reward_name',
      header: t('Name'),
    },
    {
      accessorKey: 'target',
      header: t('Points'),
    },
    {
      accessorKey: 'created_at',
      header: t('Date'),
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Customer Rewards')} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <DataTable
          columns={columns}
          data={rewards as unknown as CustomerReward[]}
          title={t('Customer Rewards')}
          description={customerName}
          searchKey="reward_name"
          isLoading={isLoading}
          onRefresh={() => loadRewards(currentPage)}
          useCustomPagination
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </AppLayout>
  );
}
