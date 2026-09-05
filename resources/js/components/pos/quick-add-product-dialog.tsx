'use client';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { productsApi } from '@/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';
import { usePage } from '@inertiajs/react';

interface QuickAddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    barcode: string;
    onProductCreated?: (product: any) => void;
}

export function QuickAddProductDialog({ open, onOpenChange, barcode, onProductCreated }: QuickAddProductDialogProps) {
    const { t } = useTranslation();
    const { categories } = usePage<{ categories: CategoryProduct[] }>().props;
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error(t('Product name is required.'));
            return;
        }

        setLoading(true);
        try {
            const product = await productsApi.create({
                name: name.trim(),
                barcode,
                barcode_type: 'code128',
                category_id: categoryId ? Number(categoryId) : null,
                description: description.trim() || null,
                type: 'materialized',
                status: 'available',
                stock_management: 'enabled',
                sku: '',
                tax_type: 'exclusive',
                tax_group_id: null,
                unit_group: 1,
                images: [],
                units: [
                    {
                        unit_id: 1,
                        quantity: 1,
                        sale_price_edit: price || '0',
                        wholesale_price_edit: '0',
                        cogs: 0,
                        low_quantity: 0,
                        stock_alert_enabled: false,
                        visible: true,
                    },
                ],
            });

            toast.success(t('Product created successfully.'));
            setName('');
            setCategoryId('');
            setPrice('');
            setDescription('');
            onOpenChange(false);
            onProductCreated?.(product);
        } catch (error: any) {
            toast.error(error?.message || t('Failed to create product.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Quick Add Product')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">{t('Barcode')}</label>
                        <Input value={barcode} disabled className="mt-1" />
                    </div>

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
                            <label className="text-sm font-medium">{t('Category')}</label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder={t('Select...')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(categories || []).map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">{t('Price')}</label>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="mt-1"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t('Description')}</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('Optional')}
                            className="mt-1"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                        {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        {t('Create & Add')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
