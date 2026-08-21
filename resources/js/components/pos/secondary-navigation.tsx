import CommentsDialog from '@/components/pos/comments-dialog';
import CouponsDialog from '@/components/pos/coupons-dialog';
import SettingsDialog from '@/components/pos/settings-dialog';
import TaxesDialog from '@/components/pos/taxes-dialog';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { MessageSquare, Package, Receipt, SettingsIcon, Ticket } from 'lucide-react';
import { useState } from 'react';

type Props = {
  setShowSelectCustomerDialog: (value: boolean) => void;
};

export default function SecondaryNavigation({ setShowSelectCustomerDialog }: Props) {
  const { t } = useTranslation();
  const { order, products, options, setNote, pushCoupon, removeCoupon, updateCart, updateProduct, computeTaxes } = usePOS();
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTaxesDialogOpen, setIsTaxesDialogOpen] = useState(false);
  const [isCouponsDialogOpen, setIsCouponsDialogOpen] = useState(false);

  const showTaxes = options.ns_jgrem_vat === 'variable_vat';

  const handleSaveNote = (note: string, display: boolean) => {
    setNote(note, display ? 'visible' : 'hidden');
  };

  const handleSaveSettings = (settings: { orderName: string; createdAt: string }) => {
    updateCart({ title: settings.orderName });
  };

  const handleSaveTax = (taxGroupId: number | null, taxType: string) => {
    // In variable_vat mode the order-level tax group is the single source of tax.
    // Zero out product-level tax values so the backend doesn't double-count
    // (product tax + order tax) when it re-computes the order total.
    products.forEach((product) => {
      updateProduct(product, {
        tax_value: 0,
        total_tax_value: 0,
        tax_group_id: undefined,
      });
    });
    updateCart({ tax_group_id: taxGroupId, tax_type: taxType });
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    pushCoupon(coupon);
  };

  const handleRemoveCoupon = (coupon: Coupon) => {
    removeCoupon(coupon);
  };

  return (
    <>
      <div className="bg-background border-b p-2.5">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="active:scale-95 flex h-11 items-center" onClick={() => setIsCommentsDialogOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('Comments')}
            {order.note && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
          </Button>
          {showTaxes && (
            <Button variant="outline" size="sm" className="active:scale-95 flex h-11 items-center" onClick={() => setIsTaxesDialogOpen(true)}>
              <Receipt className="mr-2 h-4 w-4" />
              {t('Taxes')}
              {order.tax_group_id && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
            </Button>
          )}
          <Button variant="outline" size="sm" className="active:scale-95 flex h-11 items-center" onClick={() => setIsCouponsDialogOpen(true)}>
            <Ticket className="mr-2 h-4 w-4" />
            {t('Coupons')}
            {order.coupons.length > 0 && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
          </Button>
          <Button variant="outline" size="sm" className="active:scale-95 flex h-11 items-center" onClick={() => setIsSettingsDialogOpen(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            {t('Settings')}
            {order.title && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
          </Button>
          <Button variant="outline" size="sm" className="active:scale-95 flex h-11 items-center">
            <Package className="mr-2 h-4 w-4" />
            {t('Product')}
          </Button>
        </div>
      </div>

      <CommentsDialog
        isOpen={isCommentsDialogOpen}
        onClose={() => setIsCommentsDialogOpen(false)}
        onSave={handleSaveNote}
        initialNote={order.note}
        initialDisplayOnReceipt={order.note_visibility === 'visible'}
      />

      <TaxesDialog
        isOpen={isTaxesDialogOpen}
        onClose={() => setIsTaxesDialogOpen(false)}
        onSave={handleSaveTax}
        currentTaxGroupId={order.tax_group_id ?? null}
        currentTaxType={order.tax_type ?? 'inclusive'}
      />

      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={{ orderName: order.title, createdAt: '' }}
      />

      <CouponsDialog
        isOpen={isCouponsDialogOpen}
        onClose={() => setIsCouponsDialogOpen(false)}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        activeCoupons={order.coupons as Coupon[]}
        selectedCustomer={order.customer ?? null}
        setShowSelectCustomerDialog={setShowSelectCustomerDialog}
      />
    </>
  );
}
