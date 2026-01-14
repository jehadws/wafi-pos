import CommentsDialog from '@/components/pos/comments-dialog';
import CouponsDialog from '@/components/pos/coupons-dialog';
import SettingsDialog from '@/components/pos/settings-dialog';
import TaxesDialog from '@/components/taxes-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { InertiaFormProps } from '@inertiajs/react';
import { MessageSquare, Package, Receipt, SettingsIcon, Ticket } from 'lucide-react';
import { useState } from 'react';

type Props = {
    form: InertiaFormProps<OrderFormValuesType>;
    setShowSelectCustomerDialog: (value: boolean) => void;
};

export default function SecondaryNavigation({ form, setShowSelectCustomerDialog }: Props) {
    const { t } = useTranslation();
    const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [isTaxesDialogOpen, setIsTaxesDialogOpen] = useState(false);
    const [isCouponsDialogOpen, setIsCouponsDialogOpen] = useState(false);

    const [taxRate, setTaxRate] = useState(8); // Default 8% tax
    const [taxType, setTaxType] = useState('percentage');

    const handleSaveNote = (note: string, display: boolean) => {
        form.setData('note', note);
        form.setData('note_visibility', display ? 'visible' : 'hidden');
    };

    const handleSaveSettings = (settings: { orderName: string; createdAt: string }) => {
        form.setData('title', settings.orderName);
        form.setData('created_at', settings.createdAt);
    };

    const handleSaveTax = (rate: number, type: string) => {
        setTaxRate(rate);
        setTaxType(type);
    };

    const handleApplyCoupon = (coupon: Coupon) => {
        form.setData('coupons', [...form.data.coupons, coupon]);
    };

    const handleRemoveCoupon = (coupon: Coupon) => {
        form.setData(
            'coupons',
            form.data.coupons.filter((c) => c.code !== coupon.code),
        );
    };

    return (
        <>
            <div className="bg-background border-b p-2.5">
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center" onClick={() => setIsCommentsDialogOpen(true)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {t('Comments')}
                        {form.data.note && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center" onClick={() => setIsTaxesDialogOpen(true)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        {t('Taxes')}
                        {taxRate > 0 && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center" onClick={() => setIsCouponsDialogOpen(true)}>
                        <Ticket className="mr-2 h-4 w-4" />
                        {t('Coupons')}
                        {form.data.coupons.length > 0 && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center" onClick={() => setIsSettingsDialogOpen(true)}>
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        {t('Settings')}
                        {form.data.title && <span className="bg-primary ml-2 h-2 w-2 rounded-full"></span>}
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        {t('Product')}
                    </Button>
                </div>
            </div>

            <CommentsDialog
                isOpen={isCommentsDialogOpen}
                onClose={() => setIsCommentsDialogOpen(false)}
                onSave={handleSaveNote}
                initialNote={form.data.note}
                initialDisplayOnReceipt={form.data.note_visibility === 'visible'}
            />

            <TaxesDialog
                isOpen={isTaxesDialogOpen}
                onClose={() => setIsTaxesDialogOpen(false)}
                onSave={handleSaveTax}
                currentTaxRate={taxRate}
                currentTaxType={taxType}
            />

            <SettingsDialog
                isOpen={isSettingsDialogOpen}
                onClose={() => setIsSettingsDialogOpen(false)}
                onSave={handleSaveSettings}
                initialSettings={{ orderName: form.data.title, createdAt: form.data.created_at }}
            />

            <CouponsDialog
                isOpen={isCouponsDialogOpen}
                onClose={() => setIsCouponsDialogOpen(false)}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                activeCoupons={form.data.coupons}
                selectedCustomer={form.data.customer}
                setShowSelectCustomerDialog={setShowSelectCustomerDialog}
            />
        </>
    );
}
