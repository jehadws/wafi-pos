import { useState } from 'react';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';

export interface UsePosDialogCoordinatorOptions {
    onConfirmDiscount: (discount: string) => void;
    onConfirmQuantity: (quantity: string) => void;
    allowDecimalQuantities?: boolean;
}

export function usePosDialogCoordinator({
    onConfirmDiscount,
    onConfirmQuantity,
    allowDecimalQuantities = true,
}: UsePosDialogCoordinatorOptions) {
    const [showSearchProductsDialog, setShowSearchProductsDialog] = useState(false);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [isResetCartOpen, setIsResetCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const discountKeypad = useNumericKeypad({
        onConfirm: onConfirmDiscount,
        initialValue: '',
        title: 'Cart Discount',
        maxLength: 6,
        allowDecimal: true,
    });

    const quantityKeypad = useNumericKeypad({
        onConfirm: onConfirmQuantity,
        initialValue: '',
        title: 'Define Quantity',
        maxLength: 6,
        allowDecimal: allowDecimalQuantities,
    });

    return {
        showSearchProductsDialog,
        setShowSearchProductsDialog,
        showOrderDialog,
        setShowOrderDialog,
        isResetCartOpen,
        setIsResetCartOpen,
        selectedProduct,
        setSelectedProduct,
        discountKeypad,
        quantityKeypad,
    };
}
