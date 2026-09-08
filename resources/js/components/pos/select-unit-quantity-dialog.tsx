import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { resolveUnitDisplayPrice } from '@/constants/pos-options';
import { resolveProductUnitQuantities } from '@/services/product-units';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SelectUnitQuantityDialog({ selectProduct }: { selectProduct: Product | undefined }) {
    const { t } = useTranslation();
    const { options } = usePage<{ options: SbPosOptions }>().props;
    const { openDialogs, closeDialog } = usePOS();
    const open = openDialogs['selectQuantity'] || false;
    const [quantities, setQuantities] = useState<UnitQuantity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadQuantities = async (product: Product) => {
        try {
            setQuantities([]);
            setIsLoading(true);
            const loadedQuantities = await resolveProductUnitQuantities(product);

            if (loadedQuantities.length === 0) {
                closeDialog('selectQuantity', null);
                return toast.error(t('Unable to proceed, no product were provided.'));
            }

            // Auto-select: if exactly one unit, or if a default unit is configured and matches
            const defaultUnitId = options.sb_subul_quick_product_default_unit;
            if (loadedQuantities.length === 1) {
                return closeDialog('selectQuantity', loadedQuantities[0]);
            } else if (defaultUnitId) {
                const matched = loadedQuantities.find((q) => q.unit?.id === defaultUnitId || q.unit_id === defaultUnitId);
                if (matched) {
                    return closeDialog('selectQuantity', matched);
                }
            }

            setQuantities(loadedQuantities);
        } catch (e) {
            console.error(e);
            // Always settle the openDialog('selectQuantity') promise — a
            // resolver left pending would freeze the product-click queue.
            closeDialog('selectQuantity', null);
            toast.error(t('Failed to load product units. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const selectUnit = (unit: UnitQuantity) => {
        if (unit.unit === null) {
            toast.error(t('The form is not valid.'));

            return closeDialog('selectQuantity', null);
        }
        closeDialog('selectQuantity', unit);
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
