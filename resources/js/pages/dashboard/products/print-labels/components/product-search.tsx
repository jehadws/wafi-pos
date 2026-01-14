import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import axios from 'axios';
import { Printer, Search, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SelectedProduct extends ProductSearchResult {
    times: number;
    selectedUnitQuantity: UnitQuantity | null;
}

interface ProductSearchProps {
    selectedProducts: SelectedProduct[];
    onProductsChange: (products: SelectedProduct[]) => void;
    onPrint: () => void;
}
export function ProductSearch({ selectedProducts, onProductsChange, onPrint }: ProductSearchProps) {
    const { t } = useTranslation();
    const [times, setTimes] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
    const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity | null>(null);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            const { data } = await axios.post('/api/products/search', { search: query });
            console.log(data);
            setSearchResults(data);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const addProduct = (product: ProductSearchResult) => {
        setSelectedProduct({
            ...product,
            times: 1,
            selectedUnitQuantity: null,
        });
        setIsOpen(true);
        setSearchResults([]);
        setShowResults(false);
        setSearchQuery('');
    };

    const handleConfirm = () => {
        if (selectedProduct) {
            const product: SelectedProduct = {
                ...selectedProduct,
                times,
                selectedUnitQuantity,
            };
            setSelectedProduct(product);
            setIsOpen(false);

            const productIndex = selectedProducts.findIndex((p) => p?.selectedUnitQuantity?.id === product?.selectedUnitQuantity?.id);
            console.log('prodcut index', productIndex);
            console.log('product', product);
            console.log('selected products', selectedProducts);
            console.log('times', times);
            console.log('selected unit quantity', selectedUnitQuantity);

            if (productIndex !== -1) {
                const updatedProducts = [...selectedProducts];
                updatedProducts[productIndex] = product;
                onProductsChange(updatedProducts);
            } else {
                onProductsChange([...selectedProducts, product]);
            }
        }
    };

    const handleRemoveProduct = (product: SelectedProduct) => {
        const updatedProducts = selectedProducts.filter((p) => p?.selectedUnitQuantity?.id !== product?.selectedUnitQuantity?.id);
        onProductsChange(updatedProducts);
    };

    const handleOpenSettings = (product: SelectedProduct) => {
        setIsOpen(true);
        setSelectedProduct(product);
        setTimes(product.times);
        setSelectedUnitQuantity(product.selectedUnitQuantity);
    };

    return (
        <>
            <div className="w-80 space-y-4 border-r p-4">
                <div>
                    <h3 className="mb-3 font-semibold">{t('Products')}</h3>

                    <div className="bg-background relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                        <Input
                            placeholder={t('Search Products...')}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />

                        {showResults && searchResults.length > 0 && (
                            <div className="bg-background absolute top-full right-0 left-0 z-10 max-h-48 overflow-y-auto rounded-md border shadow-lg">
                                {searchResults.map((product) => (
                                    <div key={product.id} className="cursor-pointer border-b p-3 last:border-b-0" onClick={() => addProduct(product)}>
                                        <div className="text-sm font-medium">{product.name}</div>
                                        <div className="text-xs">{product.barcode}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="mb-2 font-medium">{t('Included Products')}</h4>
                    <div className="space-y-2">
                        {selectedProducts.map((product) => (
                            <div key={product.selectedUnitQuantity?.id} className="rounded border p-3">
                                <div className="mb-2 flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-medium">
                                            {product.name} ({product.selectedUnitQuantity?.unit.name}) x{product.times}
                                        </div>
                                        <div className="text-xs text-gray-500">{product.barcode}</div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleOpenSettings(product)}>
                                            <Settings className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => handleRemoveProduct(product)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button onClick={onPrint} className="w-full bg-green-600 hover:bg-green-700" disabled={selectedProducts.length === 0}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('Print Labels')}
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <DialogTitle className="text-left">{t('Settings')}</DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="sr-only">{t('Settings')}</DialogDescription>
                    </DialogHeader>
                    <div>
                        <FormField label={t('Unit')} htmlFor="unit" description={t('Choose the unit to apply for the item')}>
                            <Select
                                value={selectedUnitQuantity?.id.toString()}
                                onValueChange={(value) =>
                                    setSelectedUnitQuantity(selectedProduct?.unit_quantities.find((unitQuantity) => unitQuantity.id === +value)!)
                                }
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
                            <Input id="quantity" name="quantity" type="number" value={times} onChange={(e) => setTimes(+e.target.value)} />
                        </FormField>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button type="button" onClick={handleConfirm} className="flex-1">
                            {t('Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
