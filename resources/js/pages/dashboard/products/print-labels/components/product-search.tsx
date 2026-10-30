import { productsApi } from '@/api';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { Printer, Search, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SelectedProduct } from '../page';

const MAX_COPIES = 999;

interface ProductSearchProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
  onPrint: () => void;
}
export function ProductSearch({ selectedProducts, onProductsChange, onPrint }: ProductSearchProps) {
  const { t } = useTranslation();
  const [timesText, setTimesText] = useState('1');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity | null>(null);
  const [editingUnitQuantityId, setEditingUnitQuantityId] = useState<number | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const data = await productsApi.search(query);
      setSearchResults(data);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const addProduct = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    setSelectedUnitQuantity(product.unit_quantities?.[0] ?? null);
    setTimesText('1');
    setEditingUnitQuantityId(null);
    setIsOpen(true);
    setSearchResults([]);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (!selectedProduct || !selectedUnitQuantity) return;

    const parsedTimes = Number.parseInt(timesText, 10);
    const product: SelectedProduct = {
      ...selectedProduct,
      times: Math.min(MAX_COPIES, Math.max(1, Number.isNaN(parsedTimes) ? 1 : parsedTimes)),
      selectedUnitQuantity,
    };

    // When editing, replace the original entry even if its unit changed, and drop any other entry already using the new unit.
    const targetId = editingUnitQuantityId ?? selectedUnitQuantity.id;
    const updatedProducts = selectedProducts.filter(
      (p) => p.selectedUnitQuantity.id !== selectedUnitQuantity.id || p.selectedUnitQuantity.id === targetId,
    );
    const productIndex = updatedProducts.findIndex((p) => p.selectedUnitQuantity.id === targetId);

    if (productIndex !== -1) {
      updatedProducts[productIndex] = product;
    } else {
      updatedProducts.push(product);
    }

    onProductsChange(updatedProducts);
    setIsOpen(false);
  };

  const handleRemoveProduct = (product: SelectedProduct) => {
    onProductsChange(selectedProducts.filter((p) => p.selectedUnitQuantity.id !== product.selectedUnitQuantity.id));
  };

  const totalLabels = selectedProducts.reduce((total, product) => total + product.times, 0);

  const handleOpenSettings = (product: SelectedProduct) => {
    setSelectedProduct(product);
    setTimesText(String(product.times));
    setSelectedUnitQuantity(product.selectedUnitQuantity);
    setEditingUnitQuantityId(product.selectedUnitQuantity.id);
    setIsOpen(true);
  };

  return (
    <>
      <div className="flex w-80 flex-col gap-5 border-e p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{t('Products')}</h3>

          <div className="bg-background relative">
            <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <Input placeholder={t('Search Products...')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="ps-10" />

            {showResults && searchResults.length > 0 && (
              <div className="bg-background absolute start-0 end-0 top-full z-10 max-h-56 overflow-y-auto rounded-lg border shadow-lg">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="hover:bg-accent/60 w-full border-b p-3 text-start last:border-b-0"
                  >
                    <div className="text-sm font-medium">{product.name}</div>
                    <div className="text-muted-foreground font-mono text-xs">{product.barcode}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t('Included Products')}</h4>
            {selectedProducts.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => onProductsChange([])}>
                <Trash2 className="h-3 w-3" />
                {t('Clear all')}
              </Button>
            )}
          </div>

          {selectedProducts.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
              {t('Search for a product to add it to the label batch.')}
            </p>
          ) : (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {selectedProducts.map((product) => (
                <div key={product.selectedUnitQuantity.id} className="hover:border-primary/40 rounded-lg border p-3 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium" dir="auto">
                        {product.name}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                        <span>{product.selectedUnitQuantity.unit.name}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {product.times} {t('labels')}
                        </span>
                      </div>
                      <div className="text-muted-foreground truncate font-mono text-xs">{product.selectedUnitQuantity.barcode}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleOpenSettings(product)}>
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive h-6 w-6 p-0" onClick={() => handleRemoveProduct(product)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={onPrint} className="w-full gap-2" disabled={selectedProducts.length === 0}>
          <Printer className="h-4 w-4" />
          {totalLabels > 0 ? `${t('Print Labels')} · ${totalLabels}` : t('Print Labels')}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <DialogTitle className="text-start">{t('Settings')}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="sr-only">{t('Settings')}</DialogDescription>
          </DialogHeader>
          <div>
            <FormField label={t('Unit')} htmlFor="unit" description={t('Choose the unit to apply for the item')}>
              <Select
                value={selectedUnitQuantity?.id.toString()}
                onValueChange={(value) => {
                  const found = selectedProduct?.unit_quantities.find((unitQuantity) => unitQuantity.id === +value);
                  if (found) setSelectedUnitQuantity(found);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('Not set')} />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct?.unit_quantities?.map((unitQuantity) => (
                    <SelectItem key={unitQuantity.id} value={unitQuantity.id.toString()}>
                      {unitQuantity.unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t('Quantity')} htmlFor="quantity" description={t('Define how many time the product will be printed')}>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                max={MAX_COPIES}
                step={1}
                value={timesText}
                onChange={(e) => setTimesText(e.target.value)}
                onBlur={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  setTimesText(String(Math.min(MAX_COPIES, Math.max(1, Number.isNaN(parsed) ? 1 : parsed))));
                }}
              />
            </FormField>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={handleConfirm} className="flex-1" disabled={!selectedUnitQuantity}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
