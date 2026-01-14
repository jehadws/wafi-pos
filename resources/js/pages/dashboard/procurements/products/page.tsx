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
import { formatDateTime } from '@/utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Edit, List, MoreHorizontal } from 'lucide-react';

export default function Dashboard() {
    const { title, products } = usePage<{ products: ProcurementProduct[]; title: string }>().props;
    console.log(products);
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Procurement Products'), href: '/dashboard/procurements/products' },
    ];

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
            header: t('name'),
        },
        {
            accessorKey: 'unit_name',
            header: t('unit'),
        },
        {
            accessorKey: 'procurement_name',
            header: t('procurement'),
        },
        {
            accessorKey: 'available_quantity',
            header: t('quantity'),
        },
        {
            accessorKey: 'total_purchase_price',
            header: t('total_price'),
        },
        {
            accessorKey: 'barcode',
            header: t('barcode'),
        },
        {
            accessorKey: 'author_name',
            header: t('author'),
        },
        {
            accessorKey: 'expiration_date',
            header: t('expiration_date'),
            cell: ({ row }) => {
                const value = row.getValue('expiration_date') as string;
                return value ? formatDateTime(value) : t('na');
            },
        },
        {
            accessorKey: 'created_at',
            header: t('on'),
            cell: ({ row }) => {
                return formatDateTime(row.getValue('created_at'));
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
                                <List className="mr-2 h-4 w-4" />
                                {t('options')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id.toString())}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('copy_id')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/dashboard/procurements/products/edit/${item.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('edit')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title || t('procurement_products_list')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <DataTable
                        columns={columns}
                        data={products}
                        title={t('procurement_products_list')}
                        description={t('display_all_procurement_products')}
                        searchKey="name"
                        onRefresh={handleRefresh}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
