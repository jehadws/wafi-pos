import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { usePOS } from '@/hooks/usePOS';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { OrderProduct } from '@/types/models/order-product';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { categoriesApi } from '@/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmptyState from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import SelectUnitQuantityDialog from './select-unit-quantity-dialog';

import { validateStockAvailability } from '@/services/stock';

type Props = {
    selectedProducts: OrderProduct[];
};

export default function ProductsCategoriesPanel({ selectedProducts }: Props) {
    const { t } = useTranslation();
    const { addToCart: addProductToCart, openDialog, options, processingAddQueue } = usePOS();
    // `clothing_shop` layout: products show a badge-style name + price below the image.
    const isClothingLayout = options[POS_OPTION_KEYS.layout] === 'clothing_shop';
    const [categories, setCategories] = useState<CategoryProduct[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<CategoryProduct[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(false);

    const [selectProduct, setSelectProduct] = useState<Product>();
    const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity>();
    const [isSelectingUnit, setIsSelectingUnit] = useState(false);

    const loadCategories = async (parent?: CategoryProduct) => {
        setLoading(true);
        try {
            const content = await categoriesApi.getPosContent(parent?.id);
            setCategories(content.categories);
            setProducts(content.products);
            updateBreadCrumb(content.currentCategory);
        } catch (error) {
            // Previously silent — now surfaces the failure to the user
            toast.error(t('Failed to load categories. Please try again.'));
            console.error('[POS] loadCategories error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateBreadCrumb = (parent: CategoryProduct) => {
        if (parent) {
            const index = breadcrumb.filter((bread) => bread.id === parent.id);

            /**
             * this means, we're trying to navigate
             * through something that has already been
             * added to the breadcrumb
             */
            if (index.length > 0) {
                let allow = true;
                const prior = breadcrumb.filter((bread) => {
                    if (bread.id === index[0].id && allow) {
                        allow = false;
                        return true;
                    }

                    return allow;
                });
                setBreadcrumb(prior);
            } else {
                setBreadcrumb([...breadcrumb, parent]);
            }
        } else {
            setBreadcrumb([]);
        }
    };

    const hasCategories = () => {
        return categories.length > 0;
    };
    const hasProducts = () => {
        return products.length > 0;
    };

    const handleQuantity = (quantity: string) => {
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1) {
            return toast.warning(t('Please provide a quantity'));
        }

        if (selectedUnitQuantity && selectProduct) {
            const quantityInCart = selectedProducts.reduce((acc, product) => {
                if (
                    product.product_id === selectProduct?.id &&
                    product.unit_quantity_id === selectedUnitQuantity.id
                ) {
                    return acc + product.quantity;
                }
                return acc;
            }, 0);

            const stockCheck = validateStockAvailability(
                selectedUnitQuantity.quantity,
                qty,
                quantityInCart,
            );

            if (!stockCheck.allowed) {
                return toast.warning(t(stockCheck.reason || 'Not enough stock.'));
            }

            const ProductData = {
                ...selectProduct,
                unit_quantity_id: selectedUnitQuantity.id,
                unit_name: selectedUnitQuantity.type,
                quantities: selectedUnitQuantity,
                quantity: qty,
            };
            addProductToCart(ProductData);
            setSelectProduct(undefined);
            setSelectedUnitQuantity(undefined);
            setIsSelectingUnit(false);
        }
    };

    const quantityKeypad = useNumericKeypad({
        onConfirm: handleQuantity,
        initialValue: '',
        title: t('Define Quantity'),
        maxLength: 6,
        allowDecimal: options[POS_OPTION_KEYS.allowDecimalQuantities] ?? true,
    });

    const handleClickOnProduct = async (product: Product) => {
        if (isSelectingUnit) return;
        setIsSelectingUnit(true);
        setSelectProduct(product);
        setSelectedUnitQuantity(undefined);
        try {
            if (product.id) {
                const unitQuantity: UnitQuantity | null = await openDialog('selectQuantity');
                if (unitQuantity) {
                    setSelectedUnitQuantity(unitQuantity);
                    quantityKeypad.openKeypad();
                } else {
                    setSelectProduct(undefined);
                    setSelectedUnitQuantity(undefined);
                }
            }
        } catch (error) {
            setSelectProduct(undefined);
            setSelectedUnitQuantity(undefined);
        } finally {
            setIsSelectingUnit(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-13 items-center">
                <Button variant="ghost" className="cursor-pointer rounded-none" size={'sm'} onClick={() => loadCategories()}>
                    {t('Home')}
                    <ChevronLeft className="mx-1 h-4 w-4" />
                </Button>
                {breadcrumb.map((bread) => (
                    <div className="flex items-center" key={bread.id}>
                        <ChevronRight className="mx-1 h-4 w-4" />
                        <Button variant="ghost" className="cursor-pointer rounded-none" size={'sm'} onClick={() => loadCategories(bread)}>
                            {bread.name}
                        </Button>
                    </div>
                ))}
            </div>

            {hasCategories() ? (
                <ScrollArea className="min-h-0 w-full flex-1">
                    <div className={isClothingLayout
                        ? 'grid grid-cols-3 gap-2 p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                        : 'grid grid-cols-2 gap-3 p-3 md:grid-cols-3 lg:grid-cols-5'}>
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className={`bg-muted/30 hover:bg-muted active:scale-95 flex cursor-pointer rounded-lg border shadow-sm transition-all hover:shadow-md ${
                                    isClothingLayout
                                        ? 'flex-col p-1 pb-0'
                                        : 'flex-col'
                                }`}
                                onClick={() => loadCategories(category)}
                            >
                                <div className={isClothingLayout
                                    ? 'relative aspect-square overflow-hidden rounded-lg'
                                    : 'bg-muted relative aspect-video overflow-hidden rounded-t-lg'}>
                                    <img
                                        src={category.preview_url || '/placeholder.svg'}
                                        alt={category.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className={isClothingLayout ? 'p-2 text-center' : 'p-3'}>
                                    <h1 className={`text-center leading-tight font-semibold ${isClothingLayout ? 'text-xs' : 'text-sm'}`}>{category.name}</h1>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : !hasCategories() && !hasProducts() && !loading ? (
                <EmptyState onCreateCategories={() => {}} />
            ) : (
                <ScrollArea className="min-h-0 w-full flex-1">
                    <div className={isClothingLayout
                        ? 'grid grid-cols-3 gap-2 p-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                        : 'grid grid-cols-2 gap-3 p-3 md:grid-cols-3 lg:grid-cols-4'}>
                        {products.map((product) => {
                            const unitQuantity = product.unit_quantities?.[0];
                            const available = unitQuantity?.quantity ?? 0;
                            const price = unitQuantity?.sale_price ?? product.unit_quantities?.[0]?.sale_price ?? 0;
                            const isAvailable = available > 0;

                            return (
                                <div
                                    key={product.id}
                                    className={`bg-muted/30 active:scale-95 flex rounded-lg border shadow-sm transition-all hover:shadow-md ${
                                        isAvailable ? 'hover:bg-muted cursor-pointer' : 'cursor-not-allowed opacity-50'
                                    } ${
                                        isClothingLayout
                                            ? 'flex-col p-1 pb-0'
                                            : 'flex-col'
                                    }`}
                                    onClick={() => isAvailable && handleClickOnProduct(product)}
                                >
                                    <div className={isClothingLayout
                                        ? 'relative aspect-square overflow-hidden rounded-lg'
                                        : 'bg-muted relative aspect-video overflow-hidden rounded-t-lg'}>
                                        <img
                                            src={(product as any).preview_url || '/placeholder.svg'}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    {isClothingLayout ? (
                                        <div className="flex flex-1 flex-col items-center p-2 text-center">
                                            <h1 className="text-xs leading-tight font-medium break-words">{product.name}</h1>
                                            <span className="text-xs font-semibold text-primary">{formatCurrency(price)}</span>
                                            {!isAvailable && (
                                                <span className="text-red-500 text-xs">{t('Out of stock')}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col justify-between p-3">
                                            <h1 className="text-center text-sm leading-tight font-semibold">{product.name}</h1>
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(price)}</span>
                                                <span className={`${isAvailable ? 'text-muted-foreground' : 'text-red-500'}`}>
                                                    {available} {t('available')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            )}

            <SelectUnitQuantityDialog selectProduct={selectProduct} />
            <NumericKeypadDialog {...quantityKeypad.keypadProps} />
        </div>
    );
}
