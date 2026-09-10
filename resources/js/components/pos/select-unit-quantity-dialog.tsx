import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { POS_OPTION_KEYS, resolveUnitDisplayPrice } from '@/constants/pos-options';
import { pickExpressUnit, resolveProductUnitQuantities } from '@/services/product-units';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SelectUnitQuantityDialogProps {
    selectProduct: Product | undefined;
    /** Store dialog key — a second instance (barcode-scan flow) runs
     *  alongside the categories-panel one without sharing open-state. */
    dialogKey?: 'selectQuantity' | 'unitPicker';
}

export default function SelectUnitQuantityDialog({
    selectProduct,
    dialogKey = 'selectQuantity',
}: SelectUnitQuantityDialogProps) {
    const { t } = useTranslation();
    const { options } = usePage<{ options: SbPosOptions }>().props;
    const { openDialogs, closeDialog } = usePOS();
    const open = openDialogs[dialogKey] || false;
    const [quantities, setQuantities] = useState<UnitQuantity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadQuantities = async (product: Product) => {
        try {
            setQuantities([]);
            setIsLoading(true);
            const loadedQuantities = await resolveProductUnitQuantities(product);

            if (loadedQuantities.length === 0) {
                closeDialog(dialogKey, null);
                return toast.error(t('Unable to proceed, no product were provided.'));
            }

            // Auto-select: a single unit, or the configured default unit
            // (the same express rule the categories panel uses).
            const auto = pickExpressUnit(loadedQuantities, options[POS_OPTION_KEYS.quickProductDefaultUnit]);
            if (auto) {
                return closeDialog(dialogKey, auto);
            }

            setQuantities(loadedQuantities);
        } catch (e) {
            console.error(e);
            // Always settle the openDialog promise — a resolver left pending
            // would freeze the product-click queue.
            closeDialog(dialogKey, null);
            toast.error(t('Failed to load product units. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const selectUnit = (unit: UnitQuantity) => {
        if (unit.unit === null) {
            toast.error(t('The form is not valid.'));

            return closeDialog(dialogKey, null);
        }
        closeDialog(dialogKey, unit);
    };

    useEffect(() => {
        if (selectProduct && open) {
            loadQuantities(selectProduct);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectProduct, open]);

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) closeDialog('selectQuantity', null);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {selectProduct?.name} - {t('Define Quantity')}
                    </DialogTitle>
                </DialogHeader>
                {isLoading && (
                    <div className="flex h-[120px] w-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                    {!isLoading &&
                        quantities?.map((quantity) => (
                            <div
                                onClick={() => selectUnit(quantity)}
                                key={quantity.id}
                                className="hover:bg-accent relative grid min-h-[120px] cursor-pointer items-end border text-sm font-medium"
                            >
                                <div className="absolute inset-0 z-10">
                                    <img src={quantity.unit.preview_url || '/placeholder.svg'} className="h-full w-full" />
                                </div>
                                <div className="bg-muted/70 hover:bg-accent/80 z-40 p-2 text-center">
                                    <div className="text-lg font-semibold">
                                        {quantity.unit.name} ({quantity.quantity})
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatCurrency(resolveUnitDisplayPrice(quantity, options))}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
