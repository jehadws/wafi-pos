import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { router } from '@inertiajs/react';
import { LayoutDashboard, RotateCcw, ShoppingCart, Truck, Users } from 'lucide-react';

interface PrimaryNavigationProps {
    resetCart: () => void;
    handleOpenSelectCustomerDialog: (open: boolean) => void;
    handleOpenOrderDialog: (open: boolean) => void;
    handleOpenOrderTypeDialog: (open: boolean) => void;
}

export default function PrimaryNavigation({
    resetCart,
    handleOpenOrderTypeDialog,
    handleOpenSelectCustomerDialog,
    handleOpenOrderDialog,
}: PrimaryNavigationProps) {
    const { t } = useTranslation();
    return (
        <div className="bg-background border-b p-2">
            <div className="flex space-x-2">
                <Button variant={'default'} onClick={() => router.visit('/dashboard')} className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('Dashboard')}
                </Button>
                <Button variant={'outline'} className="flex items-center" onClick={() => handleOpenOrderDialog(true)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t('Orders')}
                </Button>
                <Button variant={'outline'} className="flex items-center" onClick={() => handleOpenOrderTypeDialog(true)}>
                    <Truck className="mr-2 h-4 w-4" />
                    {t('Order Type')}
                </Button>
                <Button variant={'outline'} className="flex items-center" onClick={() => handleOpenSelectCustomerDialog(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    {t('Customers')}
                </Button>
                <Button variant="destructive" onClick={resetCart} className="ml-auto flex items-center">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('Reset')}
                </Button>
            </div>
        </div>
    );
}
