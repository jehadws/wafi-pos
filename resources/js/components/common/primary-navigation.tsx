import { Button } from '@/components/ui/button';
import { useRegisterStore } from '@/hooks/pos/use-register-store';
import { useTranslation } from '@/lib/i18n';
import { router } from '@inertiajs/react';
import { Banknote, LayoutDashboard, RotateCcw, ShoppingCart, Truck, Users } from 'lucide-react';

interface PrimaryNavigationProps {
  resetCart: () => void;
  handleOpenSelectCustomerDialog: (open: boolean) => void;
  handleOpenOrderDialog: (open: boolean) => void;
  handleOpenOrderTypeDialog: (open: boolean) => void;
  /** Opens the cash-register session dialog (registers enabled only). */
  handleOpenRegisterSession?: () => void;
}

export default function PrimaryNavigation({
  resetCart,
  handleOpenOrderTypeDialog,
  handleOpenSelectCustomerDialog,
  handleOpenOrderDialog,
  handleOpenRegisterSession,
}: PrimaryNavigationProps) {
  const { t } = useTranslation();
  const currentRegister = useRegisterStore((s) => s.currentRegister);
  return (
    <div className="bg-background border-b p-2">
      <div className="flex gap-2">
        <Button variant={'default'} onClick={() => router.visit('/dashboard')} className="flex items-center">
          <LayoutDashboard className="me-2 h-4 w-4" />
          {t('Dashboard')}
        </Button>
        <Button variant={'outline'} className="flex items-center" onClick={() => handleOpenOrderDialog(true)}>
          <ShoppingCart className="me-2 h-4 w-4" />
          {t('Orders')}
        </Button>
        <Button variant={'outline'} className="flex items-center" onClick={() => handleOpenOrderTypeDialog(true)}>
          <Truck className="me-2 h-4 w-4" />
          {t('Order Type')}
        </Button>
        <Button variant={'outline'} className="flex items-center" onClick={() => handleOpenSelectCustomerDialog(true)}>
          <Users className="me-2 h-4 w-4" />
          {t('Customers')}
        </Button>
        {handleOpenRegisterSession && currentRegister && (
          <Button variant={'outline'} className="flex items-center" onClick={handleOpenRegisterSession}>
            <Banknote className="me-2 h-4 w-4" />
            {currentRegister.name}
          </Button>
        )}
        <Button variant="destructive" onClick={resetCart} className="ms-auto flex items-center">
          <RotateCcw className="me-2 h-4 w-4" />
          {t('Reset')}
        </Button>
      </div>
    </div>
  );
}
