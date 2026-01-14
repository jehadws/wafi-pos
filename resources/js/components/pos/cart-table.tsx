'use client';

import CartItemComponent from '@/components/pos/cart-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/i18n';
import { Trash2 } from 'lucide-react';

interface CartTableProps {
    cart: CartProduct[];
    removeFromCart: (product: CartProduct) => void;
    updateQuantity: (product: CartProduct, quantity: number) => void;
    updatePrice: (product: CartProduct, price: number) => void;
    updateDiscountPercentage: (product: CartProduct, price: number) => void;
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
    const { t } = useTranslation();
    const allSelected = cart.length > 0 && selectedItems.length === cart.length;
    const someSelected = selectedItems.length > 0 && selectedItems.length < cart.length;

    return (
        <div className="flex-1 overflow-hidden">
            <div className="bg-muted/50 grid h-13 grid-cols-14 border-b pl-4 text-sm font-medium">
                <div className="col-span-10 inline-flex items-center">{t('Product')}</div>
                <div className="col-span-2 inline-flex items-center justify-center border-l text-center">{t('Quantity')}</div>
                <div className="col-span-2 inline-flex items-center justify-center border-l text-center">{t('Total')}</div>
            </div>
            <div className="flex h-full flex-col">
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
                                <div key={item._uuid} className="flex items-center border-b">
                                    <div className="pl-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item._uuid)}
                                            onChange={() => toggleItemSelection(item._uuid)}
                                            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <CartItemComponent
                                            key={item.product_id}
                                            item={item}
                                            updatePrice={updatePrice}
                                            updateDiscountPercentage={updateDiscountPercentage}
                                            removeFromCart={removeFromCart}
                                            updateQuantity={updateQuantity}
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
