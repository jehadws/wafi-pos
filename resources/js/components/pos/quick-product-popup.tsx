import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { taxesApi, unitsApi } from '@/api';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TaxGroup } from '@/types/models/tax';
import { Unit } from '@/types/models/unit';

type ProductType = 'product' | 'dynamic';

/**
 * Select sentinel for "no tax" — Radix Select forbids empty item values,
 * so the NexoPOS "Disabled" option (value: '') is mapped through this key.
 */
const TAX_TYPE_DISABLED = 'disabled';

interface QuickProductPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Prefill for the name field — the unknown-barcode scan flow opens this
     * popup right after a barcode fails to resolve and passes it here.
     */
    defaultName?: string;
}

/**
 * NexoPOS-style quick product popup (ns-pos-quick-product-popup.vue).
 *
 * Adds a custom, non-persisted cart line (`mode: 'custom'`) straight to the
 * order — it never creates a catalog product. Normal items carry a unit
 * price + quantity; "dynamic" items are percentage-based services whose
 * total is derived from the cart subtotal at order level (see
 * sumProductsTotals in services/cart-engine.ts).
 *
 * The cart engine recomputes every derived field (tax split, totals) once
 * the line enters the cart, using source.tax_group + the line's tax type —
 * mirroring how NexoPOS's POS.computeProductTax ran on $original().
 */
export function QuickProductPopup({ open, onOpenChange, defaultName }: QuickProductPopupProps) {
    const { t } = useTranslation();
    const { addToCart, options } = usePOS();

    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
    const [name, setName] = useState('');
    const [productType, setProductType] = useState<ProductType>('product');
    const [rate, setRate] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unitId, setUnitId] = useState('');
    const [taxType, setTaxType] = useState('inclusive');
    const [taxGroupId, setTaxGroupId] = useState('');

    useEffect(() => {
        if (!open) return;

        // Fresh form on every open — the popup may be reused back-to-back.
        setName(defaultName ?? '');
        setProductType('product');
        setRate('');
        setUnitPrice('');
        setQuantity('1');
        setTaxType(options[POS_OPTION_KEYS.taxType] === 'exclusive' ? 'exclusive' : 'inclusive');
        setUnitId(String(options[POS_OPTION_KEYS.quickProductDefaultUnit] ?? ''));
        setTaxGroupId('');
        setUnits([]);
        setTaxGroups([]);
        setLoading(true);

        let cancelled = false;

        // Load the units and tax groups the popup offers (the same two
        // endpoints NexoPOS loads — /api/units and /api/taxes/groups, the
        // latter embedding each group's taxes), then apply the option-driven
        // prefill only when the referenced unit/group actually exists.
        Promise.all([unitsApi.getAll(), taxesApi.getGroups()])
            .then(([unitList, groupList]) => {
                if (cancelled) return;
                const nextUnits = (unitList as Unit[]) ?? [];
                const nextGroups = (groupList as TaxGroup[]) ?? [];
                setUnits(nextUnits);
                setTaxGroups(nextGroups);

                const defaultUnitId = String(options[POS_OPTION_KEYS.quickProductDefaultUnit] ?? '');
                if (defaultUnitId && nextUnits.some((unit) => String(unit.id) === defaultUnitId)) {
                    setUnitId(defaultUnitId);
                }

                const preferredGroupId = String(options[POS_OPTION_KEYS.taxGroup] ?? '');
                if (preferredGroupId && nextGroups.some((group) => String(group.id) === preferredGroupId)) {
                    setTaxGroupId(preferredGroupId);
                } else if (nextGroups.length > 0) {
                    setTaxGroupId(String(nextGroups[0].id));
                }
            })
            .catch(() => {
                if (!cancelled) toast.error(t('Unable to load the popup data.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
        // The form is intentionally re-seeded only when the popup opens;
        // mid-session option changes must not wipe in-progress input.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultName]);

    const handleCreate = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error(t('Product name is required.'));
            return;
        }

        const isDynamic = productType === 'dynamic';
        if (isDynamic && rate.trim() === '') {
            toast.error(t('The rate is required for dynamic products.'));
            return;
        }

        const parsedRate = parseFloat(rate) || 0;
        const parsedPrice = parseFloat(unitPrice) || 0;
        const parsedQuantity = parseFloat(quantity) || 1;

        if (!isDynamic && parsedQuantity <= 0) {
            toast.error(t('Quantity must be greater than zero.'));
            return;
        }

        const unit = units.find((candidate) => String(candidate.id) === unitId);
        const taxGroup = taxGroups.find((candidate) => String(candidate.id) === taxGroupId) ?? null;
        const resolvedTaxType = taxType === TAX_TYPE_DISABLED ? '' : taxType;

        // Custom cart line — the cart engine derives tax + totals from
        // source.tax_group, tax_type and unit_price once it lands. No
        // quantities object: the line is not stock-tracked (the stock
        // validator treats missing quantities as unlimited, matching the
        // stock_management: 'disabled' NexoPOS puts on $original()).
        addToCart({
            name: trimmedName,
            product_type: productType,
            rate: isDynamic ? parsedRate : 0,
            mode: 'custom',
            quantity: isDynamic ? 1 : parsedQuantity,
            unit_price: isDynamic ? 0 : parsedPrice,
            unit_id: isDynamic ? 0 : (unit?.id ?? 0),
            unit_name: isDynamic ? t('N/A') : (unit?.name ?? ''),
            tax_type: resolvedTaxType || undefined,
            tax_group_id: taxGroup?.id ?? 0,
            tax_value: 0,
            discount: 0,
            discount_percentage: 0,
            price_with_tax: 0,
            price_without_tax: 0,
            total_price: 0,
            total_price_with_tax: 0,
            total_price_without_tax: 0,
            total_tax_value: 0,
            source: {
                id: 0,
                category_id: 0,
                tax_type: resolvedTaxType,
                tax_group: taxGroup,
            },
        });

        onOpenChange(false);
    };

    const isDynamic = productType === 'dynamic';
    const allowDecimalQuantities = options[POS_OPTION_KEYS.allowDecimalQuantities] ?? true;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Product / Service')}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                {t('Name')} <span className="text-destructive">*</span>
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('Product name')}
                                className="mt-1"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">{t('Product Type')}</label>
                                <Select value={productType} onValueChange={(value) => setProductType(value as ProductType)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product">{t('Normal')}</SelectItem>
                                        <SelectItem value="dynamic">{t('Dynamic')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isDynamic ? (
                                <div>
                                    <label className="text-sm font-medium">
                                        {t('Rate')} <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        placeholder="0"
                                        className="mt-1"
                                        min="0"
                                        step="any"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium">{t('Unit Price')}</label>
                                    <Input
                                        type="number"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="mt-1"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            )}
                        </div>

                        {!isDynamic && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('Quantity')}</label>
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="mt-1"
                                        min="1"
                                        step={allowDecimalQuantities ? 'any' : '1'}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">{t('Unit')}</label>
                                    <Select value={unitId} onValueChange={setUnitId}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder={t('Select...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map((unit) => (
                                                <SelectItem key={unit.id} value={String(unit.id)}>
                                                    {unit.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">{t('Tax Type')}</label>
                                <Select value={taxType} onValueChange={setTaxType}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inclusive">{t('Inclusive')}</SelectItem>
                                        <SelectItem value="exclusive">{t('Exclusive')}</SelectItem>
                                        <SelectItem value={TAX_TYPE_DISABLED}>{t('Disabled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">{t('Tax Group')}</label>
                                <Select value={taxGroupId} onValueChange={setTaxGroupId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={t('Select...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {taxGroups.map((group) => (
                                            <SelectItem key={group.id} value={String(group.id)}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                        {t('Create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}