'use client';

import CartItemComponent from '@/components/pos/cart-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderProduct } from '@/interfaces/order-product';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface CartTableProps {
    cart: OrderProduct[];
    removeFromCart: (product: OrderProduct) => void;
    updateQuantity: (product: OrderProduct, quantity: number) => void;
    updatePrice: (product: OrderProduct, price: number) => void;
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
                            {selectedItems.length > 0 ? t('{entries} entries selected', { entries: selectedItems.length }) : t('Select')}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {selectedItems.length > 0 && (
                            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={removeSelectedItems}>
                                <Trash2 className="mr-1 h-3 w-3" />
                                {t('Delete')}
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
                                        checked={selectedItems.includes(item._uuid ?? '')}
                                        onChange={() => toggleItemSelection(item._uuid ?? '')}
                                        className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                    />
                                </div>
                                <div className="flex-1">
                                    <CartItemComponent
                                        key={item.product_id}
                                        item={item}
                                        removeFromCart={removeFromCart}
                                        updateQuantity={updateQuantity}
                                        updatePrice={updatePrice}
                                        updateDiscountPercentage={(_product: OrderProduct, _price: number) => {}}
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
    );
}
