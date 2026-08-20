import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { ArrowRightLeft, Calculator, Package, Settings, Trash2 } from 'lucide-react';
import type { ProcurementFormData, ProcurementModalState } from './use-procurement-form';
import type { ProcurementProductItem } from '@/services/procurement';

interface ProcurementProductsTabProps {
    form: {
        data: ProcurementFormData;
    };
    searchQuery: string;
    searchResults: any[];
    taxGroups: { id: number; name: string }[];
    onSearchQueryChange: (query: string) => void;
    onSearch: (query: string) => void;
    onSelectProduct: (product: any) => void;
    onUpdateProduct: (id: number, field: keyof ProcurementProductItem, value: any) => void;
    onRemoveProduct: (id: number) => void;
    onOpenModal: (modal: ProcurementModalState) => void;
    onGetConvertUnits: (groupId: number) => void;
}

export function ProcurementProductsTab({
    form,
    searchQuery,
    searchResults,
    taxGroups,
    onSearchQueryChange,
    onSearch,
    onSelectProduct,
    onUpdateProduct,
    onRemoveProduct,
    onOpenModal,
    onGetConvertUnits,
}: ProcurementProductsTabProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <DropdownSearch
                placeholder={t('SKU, Barcode, Product name.')}
                value={searchQuery}
                onValueChange={onSearchQueryChange}
                onSearch={onSearch}
                results={searchResults}
                onSelect={onSelectProduct}
            />

            {/* Products Table */}
            <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-5 gap-4 border-b p-4 text-sm font-medium">
                    <div>{t('Name')}</div>
                    <div>{t('Unit Price')}</div>
                    <div>{t('Tax Value')}</div>
                    <div>{t('Quantity')}</div>
                    <div>{t('Total Price')}</div>
                </div>

                {form.data.products.length === 0 ? (
                    <div className="text-muted-foreground p-8 text-center text-sm">
                        {t('No products added yet. Use the search bar above to add products to this procurement.')}
                    </div>
                ) : (
                    form.data.products.map((product) => {
                        const targetId = (product.product_id || product.id) as number;
                        return (
                            <div key={targetId} className="flex flex-col border-b p-4 last:border-b-0">
                                <div className="grid grid-cols-5 gap-4">
                                    <div>
                                        <div className="px-3 py-2 font-medium">{product.name}</div>
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            value={product.purchase_price}
                                            onChange={(e) =>
                                                onUpdateProduct(targetId, 'purchase_price', Number.parseFloat(e.target.value))
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Input type="number" value={product.tax_value || 0} disabled placeholder="0.00" />
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            value={product.quantity}
                                            onChange={(e) => onUpdateProduct(targetId, 'quantity', Number.parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <div className="px-3 py-2 font-medium">USD {(product.total_purchase_price || 0).toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="mt-2 flex w-full flex-row flex-wrap gap-3">
                                    <Button onClick={() => onRemoveProduct(targetId)} variant="outline" size="sm" type="button">
                                        <Trash2 className="h-3 w-3" />
                                        {t('Delete')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => onOpenModal({ type: 'options', product_id: targetId, group_id: null })}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Settings className="h-3 w-3" />
                                        {t('Options')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => onOpenModal({ type: 'unit', product_id: targetId, group_id: null })}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Package className="h-3 w-3" />
                                        {t('Unit')}: {product.unit_id && product.unit_quantities?.[0]?.unit?.name ? product.unit_quantities[0].unit.name : 'N/A'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onOpenModal({ type: 'tax', product_id: targetId, group_id: null })}
                                    >
                                        <Calculator className="h-3 w-3" />
                                        {t('Tax')}: {product.tax_group_id ? taxGroups.find((g) => g.id === product.tax_group_id)?.name : 'N/A'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (product.unit_group) {
                                                onGetConvertUnits(product.unit_group);
                                            }
                                            onOpenModal({ type: 'convert', product_id: targetId, group_id: product.unit_group || null });
                                        }}
                                    >
                                        <ArrowRightLeft className="h-3 w-3" />
                                        {t('Convert')}: {product.convert_unit_label || 'N/A'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
