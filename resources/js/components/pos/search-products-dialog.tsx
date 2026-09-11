'use client';

import { productsApi } from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { isPosOptionEnabled, POS_OPTION_KEYS, resolveNumpadVariant, resolveUnitDisplayPrice } from '@/constants/pos-options';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { usePOS } from '@/hooks/usePOS';
import { pickExpressUnit, resolveProductUnitQuantities } from '@/services/product-units';
import { validateStockAvailability } from '@/services/stock';
import { usePage } from '@inertiajs/react';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { formatCurrency } from '../../utils/format';

interface SearchProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelected: (product: any) => void;
}

export function SearchProductsDialog({ open, onOpenChange, onProductSelected }: SearchProductsDialogProps) {
  const { t } = useTranslation();
  const { options } = usePage<{ options: SbPosOptions }>().props;

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Unit / quantity selection state ──────────────────────────────────
  // Using a secondary dialog for the unit picker (stays open after search closes)
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
  const [unitQuantities, setUnitQuantities] = useState<UnitQuantity[]>([]);

  // Reset search state when dialog closes.
  // Previously this happened for free via unmount/remount; now that the
  // component is always mounted we must clear explicitly so reopening
  // starts with a blank slate.
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setProducts([]);
      setLoading(false);
    }
  }, [open]);

  // Refs keep the selected product/unit available inside the keypad confirm
  // callback without stale-closure issues from setState batching.
  const selectedProductRef = useRef<Product | null>(null);
  const selectedUnitRef = useRef<UnitQuantity | null>(null);

  // ─── Search ────────────────────────────────────────────────────────────
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const result = await productsApi.search(query);
      if (result) setProducts(result);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Build CartProduct payload ─────────────────────────────────────────
  const buildCartProduct = (product: Product, unit: UnitQuantity, quantity: number) => {
    return {
      ...product,
      product_id: product.id,
      unit_id: unit.unit.id,
      unit_quantity_id: unit.id,
      unit_name: unit.unit.name,
      quantities: unit,
      quantity,
      _uuid: `${product.id}-${unit.unit.id}-${Date.now()}`,
    };
  };

  // ─── Express add ("Show Quantity" off) — parity with the categories panel ──
  const addDirectly = (product: Product, unit: UnitQuantity, qty: number) => {
    // Live-store in-cart count so rapid adds cannot oversell (panel parity).
    const quantityInCart = usePOS.getState().products.reduce((acc, item) => {
      if (item.product_id === product.id && item.unit_quantity_id === unit.id) {
        return acc + item.quantity;
      }
      return acc;
    }, 0);

    const stockCheck = validateStockAvailability(unit.quantity, qty, quantityInCart);
    if (!stockCheck.allowed) {
      toast.warning(t(stockCheck.reason || 'Not enough stock.'));
      return;
    }

    onProductSelected(buildCartProduct(product, unit, qty));
    selectedProductRef.current = null;
    selectedUnitRef.current = null;
  };

  // ─── Quantity keypad confirm ───────────────────────────────────────────
  const handleQuantityConfirm = (qty: string) => {
    const quantity = parseFloat(qty);
    if (isNaN(quantity) || quantity <= 0) {
      return toast.warning(t('Not enough quantity to proceed.'));
    }
    const product = selectedProductRef.current;
    const unit = selectedUnitRef.current;
    if (!product || !unit) return;

    if (unit.quantity < quantity) {
      return toast.warning(t('The specified quantity exceed the available quantity.'));
    }
    onProductSelected(buildCartProduct(product, unit, quantity));
    // Clean up refs
    selectedProductRef.current = null;
    selectedUnitRef.current = null;
  };

  const quantityKeypad = useNumericKeypad({
    onConfirm: handleQuantityConfirm,
    initialValue: '',
    title: t('Define Quantity'),
    maxLength: 6,
    allowDecimal: options[POS_OPTION_KEYS.allowDecimalQuantities] ?? true,
  });

  // ─── Unit picker: unit card clicked ──────────────────────────────────
  const handleUnitCardClick = (unit: UnitQuantity) => {
    selectedUnitRef.current = unit;
    setIsUnitPickerOpen(false);

    // "Show Quantity" off → the picked unit is added with the default
    // quantity (1) — no keypad, matching the categories panel.
    if (!isPosOptionEnabled(options, POS_OPTION_KEYS.showQuantity)) {
      const product = selectedProductRef.current;
      if (product) {
        addDirectly(product, unit, 1);
      } else {
        selectedUnitRef.current = null;
      }
      return;
    }

    quantityKeypad.openKeypad();
  };

  // ─── Product row clicked ──────────────────────────────────────────────
  const handleClickOnProduct = async (product: Product) => {
    selectedProductRef.current = product;

    // Close search dialog immediately — avoids dialog stacking issues
    onOpenChange(false);
    setSearchQuery('');
    setProducts([]);

    setLoading(true);
    try {
      // Payload-first: the search endpoint hydrates unit_quantities —
      // no extra round-trip unless the payload omitted them.
      const units = await resolveProductUnitQuantities(product);
      if (!units || units.length === 0) {
        toast.error(t('Unable to proceed, no unit quantities were found.'));
        selectedProductRef.current = null;
        return;
      }

      setUnitQuantities(units);

      // "Show Quantity" off → express flow: a single unit or the configured
      // default goes straight to the cart (no unit picker, no keypad).
      if (!isPosOptionEnabled(options, POS_OPTION_KEYS.showQuantity)) {
        const resolved = pickExpressUnit(units, options[POS_OPTION_KEYS.quickProductDefaultUnit]);
        if (resolved) {
          addDirectly(product, resolved, 1);
          return;
        }
        // Ambiguous units → picker; the pick is added with quantity 1.
        setIsUnitPickerOpen(true);
        return;
      }

      if (units.length === 1) {
        // Single unit — skip picker, go straight to quantity keypad
        selectedUnitRef.current = units[0];
        quantityKeypad.openKeypad();
      } else {
        // Multiple units — show unit picker
        setIsUnitPickerOpen(true);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('Failed to load product units. Please try again.'));
      selectedProductRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Search Dialog ── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">{t('Search Product')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
              <Input autoFocus placeholder={t('Search')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="ps-10" />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground ms-2 text-sm">{t('Loading products...')}</span>
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id} className="hover:bg-muted cursor-pointer rounded-md border p-3" onClick={() => handleClickOnProduct(product)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name || ''}</div>
                        <div className="text-muted-foreground text-sm">{product.type}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  {searchQuery.length >= 2 ? t('No products found.') : t('There is nothing to display. Have you started the search ?')}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Unit Quantity Picker ── */}
      <Dialog open={isUnitPickerOpen} onOpenChange={setIsUnitPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProductRef.current?.name} - {t('Select Unit')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {unitQuantities.map((unit) => (
              <div
                key={unit.id}
                onClick={() => handleUnitCardClick(unit)}
                className="hover:bg-accent relative grid min-h-[120px] cursor-pointer items-end border text-sm font-medium"
              >
                <div className="absolute inset-0 z-10">
                  <img src={unit.unit.preview_url || '/placeholder.svg'} className="h-full w-full object-cover" alt={unit.unit.name} />
                </div>
                <div className="bg-muted/70 hover:bg-accent/80 relative z-20 p-2 text-center">
                  <div className="text-lg font-semibold">
                    {unit.unit.name} ({unit.quantity})
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(resolveUnitDisplayPrice(unit, options))}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Quantity Keypad ── */}
      <NumericKeypadDialog {...quantityKeypad.keypadProps} variant={resolveNumpadVariant(options)} />
    </>
  );
}
