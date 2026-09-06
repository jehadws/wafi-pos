'use client';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { productsApi } from '@/api';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { formatCurrency } from '../../utils/format';
import { Button } from '@/components/ui/button';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { usePage } from '@inertiajs/react';

interface SearchProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelected: (product: CartProduct) => void;
}

export function SearchProductsDialog({ open, onOpenChange, onProductSelected }: SearchProductsDialogProps) {
  const { t } = useTranslation();
  const { options } = usePage<{ options: SbPosOptions }>().props;
  const [products, setProducts] = useState<Product[]>([]);
  const [selectProduct, setSelectProduct] = useState<Product>();
  const [quantities, setQuantities] = useState<UnitQuantity[]>();
  const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity>();

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return;
    setLoading(true);

    try {
      const products = await productsApi.search(query);
      if (products) {
        setProducts(products);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUnit = (quantity: string) => {
    setIsOpen(false);
    if (selectedUnitQuantity && selectProduct) {
      if (selectedUnitQuantity?.quantity < parseInt(quantity)) {
        return toast.warning(t('The specified quantity exceed the available quantity.'));
      }

      onProductSelected({
        order_id: null,
        product_id: selectedUnitQuantity.product_id,
        name: selectProduct.name,
        discount_type: 'percentage',
        discount: 0,
        discount_percentage: 0,
        product_type: selectProduct.type,
        rate: 0,
        quantity: parseInt(quantity),
        tax_group_id: 0,
        tax_type: 'inclusive',
        tax_value: selectedUnitQuantity.sale_price_tax,
        unit_id: selectedUnitQuantity.unit.id,
        unit_price: selectedUnitQuantity.sale_price,
        price_with_tax: selectedUnitQuantity.sale_price_with_tax,
        price_without_tax: selectedUnitQuantity.sale_price_without_tax,
        unit_name: selectedUnitQuantity.unit.name,
        total_price:
          options.sb_subul_price_with_tax === 'yes'
            ? selectedUnitQuantity.sale_price_with_tax * parseInt(quantity)
            : selectedUnitQuantity.sale_price_without_tax * parseInt(quantity),
        total_price_without_tax: selectedUnitQuantity.sale_price_without_tax * parseInt(quantity),
        total_price_with_tax: selectedUnitQuantity.sale_price_with_tax * parseInt(quantity),
        mode: 'normal',
        unit_quantity_id: selectedUnitQuantity.id,
        total_tax_value: selectedUnitQuantity.sale_price_tax * parseInt(quantity),
        _uuid: `${selectProduct.id}-${selectedUnitQuantity.unit.id}-${Date.now()}`,
      });
    }
  };

  const quantityKeypad = useNumericKeypad({
    onConfirm: handleSelectUnit,
    initialValue: '',
    title: t('Define Quantity'),
    maxLength: 6,
    allowDecimal: true,
  });

  const handleClickOnProduct = async (product: Product) => {
    setSelectProduct(product);
    try {
      setLoading(true);
      const quantities = await productsApi.getUnitQuantities(product.id);
      if (quantities && quantities.length > 0) {
        setQuantities(quantities);
        if (quantities.length > 1) {
          setIsOpen(true);
        } else {
          // add to cart
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">{t('Search Product')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input placeholder={t('Search')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="ps-10" />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground ms-2 text-sm">{t('Loading products...')}</span>
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="hover:bg-muted rounded-md border p-3"
                    onClick={() => handleClickOnProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name || ''}</div>
                        <div className="text-muted-foreground text-sm">{product.type}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">{t('There is nothing to display. Have you started the search ?')}</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectProduct?.name} - {t('Define Quantity')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {quantities?.map((quantity) => (
              <div
                onClick={() => {
                  quantityKeypad.openKeypad();
                  setSelectedUnitQuantity(quantity);
                }}
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
                    {options.sb_subul_price_with_tax === 'yes'
                      ? formatCurrency(quantity.sale_price_with_tax)
                      : formatCurrency(quantity.sale_price_without_tax)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button">{t('Confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NumericKeypadDialog {...quantityKeypad.keypadProps} />
    </>
  );
}
