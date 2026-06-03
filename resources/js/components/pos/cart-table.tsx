'use client';

import CartItemComponent from '@/components/pos/cart-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRTL } from '@/hooks/use-rtl';
import { usePOS } from '@/hooks/usePOS';
import { OrderProduct } from '@/interfaces/order-product';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface CartTableProps {
    cart: OrderProduct[];
    removeFromCart: (product: OrderProduct) => void;
    updateQuantity: (product: OrderProduct, quantity: number) => void;
    updatePrice: (product: OrderProduct, price: number) => void;
    updateDiscountPercentage: (product: OrderProduct, price: number) => void;
    clearCart: () => void;
    removeSelectedItems: () => void;
    selectedItems: string[];
    toggleItemSelection: (productId: string) => void;
    selectAllItems: () => void;
    deselectAllItems: () => void;
}

export default function CartTable({
    cart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    clearCart,
    updateDiscountPercentage,
    removeSelectedItems,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
}: CartTableProps) {
    const { isRTL } = useRTL();
    const { t } = useTranslation();
    const { options } = usePOS();
    const showQuantity = options.ns_jgrem_show_quantity !== false;
    const allSelected = cart.length > 0 && selectedItems.length === cart.length;
    const someSelected = selectedItems.length > 0 && selectedItems.length < cart.length;

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className={cn('bg-muted/50 grid h-13 border-b text-sm font-medium', showQuantity ? 'grid-cols-14' : 'grid-cols-12', isRTL ? 'pr-4' : 'pl-4')}>
                <div className={cn('inline-flex items-center', showQuantity ? 'col-span-10' : 'col-span-10', isRTL ? 'border-l' : 'border-r')}>{t('Product')}</div>
                {showQuantity && (
                    <div className={cn('col-span-2 inline-flex items-center justify-center border-l text-center', isRTL ? 'border-l' : 'border-r')}>
                        {t('Quantity')}
                    </div>
                )}
                <div className="col-span-2 inline-flex items-center justify-center text-center">{t('Total')}</div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
                {cart.length > 0 && (
                    <div className="bg-muted/20 flex items-center justify-between border-b p-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(input) => {
                                    if (input) {
                                        input.indeterminate = someSelected;
                                    }
                                }}
                                onChange={() => {
                                    if (allSelected) {
                                        deselectAllItems();
                                    } else {
                                        selectAllItems();
                                    }
                                }}
                                className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">
                                {selectedItems.length > 0 ? t('{entries} items selected', { entries: selectedItems.length }) : t('Select items')}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {selectedItems.length > 0 && (
                                <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={removeSelectedItems}>
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    {t('Delete Selected')}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearCart}>
                                <Trash2 className="mr-1 h-3 w-3" />
                                {t('Clear All')}
                            </Button>
                        </div>
                    </div>
                )}

                <ScrollArea className="min-h-[150px] flex-1">
                    {cart.length > 0 ? (
                        <div className="pb-12">
                            {cart.map((item) => (
                                <div key={item._uuid || `${item.product_id}-${item.unit_id}`} className="flex items-center border-b">
                                    <div className="pl-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item._uuid || `${item.product_id}-${item.unit_id}`)}
                                            onChange={() => toggleItemSelection(item._uuid || `${item.product_id}-${item.unit_id}`)}
                                            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <CartItemComponent
                                            key={item._uuid || `${item.product_id}-${item.unit_id}`}
                                            item={item}
                                            updatePrice={updatePrice}
                                            updateDiscountPercentage={updateDiscountPercentage}
                                            removeFromCart={removeFromCart}
                                            updateQuantity={updateQuantity}
                                            showQuantity={showQuantity}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center">
                            <div className="space-y-2">
                                <p className="text-muted-foreground">{t('No products added...')}</p>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
