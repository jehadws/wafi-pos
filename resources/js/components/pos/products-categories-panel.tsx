import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { usePOS } from '@/hooks/usePOS';
import { OrderProduct } from '@/interfaces/order-product';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { categoriesApi } from '@/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmptyState from '../empty-state';
import { Button } from '../ui/button';
import { NumericKeypadDialog } from '../ui/numeric-keypad-dialog';
import { ScrollArea } from '../ui/scroll-area';
import SelectUnitQuantityDialog from './select-unit-quantity-dialog';

type Props = {
    selectedProducts: OrderProduct[];
};

export default function ProductsCategoriesPanel({ selectedProducts }: Props) {
    const { t } = useTranslation();
    const { addToCart: addProductToCart, openDialog, options, processingAddQueue } = usePOS();
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
        if (+quantity < 1) {
            return toast.warning(t('Please provide a quantity'));
        }

        if (selectedUnitQuantity && selectProduct) {
            if (selectedUnitQuantity?.quantity < parseInt(quantity)) {
                return toast.warning(t('The specified quantity exceed the available quantity.'));
            }

            let quantityInCart = 0;
            selectedProducts.map((product) => {
                if (product.product_id === selectProduct?.id) {
                    quantityInCart += product.quantity;
                }
            });

            if (quantityInCart + parseInt(quantity) > selectedUnitQuantity?.quantity) {
                return toast.warning(
                    t(`Unable to add the product, there is not enough stock. Remaining ${selectedUnitQuantity?.quantity - quantityInCart}`, {
                        remaining: selectedUnitQuantity?.quantity - quantityInCart,
                    }),
                );
            }
            const ProductData = {
                ...selectProduct,
                unit_quantity_id: selectedUnitQuantity.id,
                unit_name: selectedUnitQuantity.type,
                $quantities: () => selectedUnitQuantity,
                quantity: parseInt(quantity),
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
        allowDecimal: options.ns_jgrem_allow_decimal_quantities ?? true,
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
                    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3 lg:grid-cols-5">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-muted/30 hover:bg-muted flex cursor-pointer flex-col rounded-lg border shadow-sm transition-all hover:shadow-md"
                                onClick={() => loadCategories(category)}
                            >
                                <div className="bg-muted relative aspect-video overflow-hidden rounded-t-lg">
                                    <img
                                        src={category.preview_url || '/placeholder.svg'}
                                        alt={category.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="p-3">
                                    <h1 className="text-center text-sm leading-tight font-semibold">{category.name}</h1>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : !hasCategories() && !hasProducts() && !loading ? (
                <EmptyState onCreateCategories={() => {}} />
            ) : (
                <ScrollArea className="min-h-0 w-full flex-1">
                    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3 lg:grid-cols-4">
                        {products.map((product) => {
                            const unitQuantity = product.unit_quantities?.[0];
                            const available = unitQuantity?.quantity ?? 0;
                            const price = unitQuantity?.sale_price ?? product.unit_quantities?.[0]?.sale_price ?? 0;
                            const isAvailable = available > 0;

                            return (
                                <div
                                    key={product.id}
                                    className={`bg-muted/30 flex flex-col rounded-lg border shadow-sm transition-all hover:shadow-md ${
                                        isAvailable ? 'hover:bg-muted cursor-pointer' : 'cursor-not-allowed opacity-50'
                                    }`}
                                    onClick={() => isAvailable && handleClickOnProduct(product)}
                                >
                                    <div className="bg-muted relative aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={product.preview_url || '/placeholder.svg'}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between p-3">
                                        <h1 className="text-center text-sm leading-tight font-semibold">{product.name}</h1>
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(price)}</span>
                                            <span className={`${isAvailable ? 'text-muted-foreground' : 'text-red-500'}`}>
                                                {available} {t('available')}
                                            </span>
                                        </div>
                                    </div>
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
