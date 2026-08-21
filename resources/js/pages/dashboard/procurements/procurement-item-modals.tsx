import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { ProcurementFormData, ProcurementModalState } from './use-procurement-form';
import type { ProcurementProductItem } from '@/services/procurement';

interface ProcurementItemModalsProps {
    form: {
        data: ProcurementFormData;
    };
    activeModal: ProcurementModalState;
    taxGroups: { id: number; name: string }[];
    units: any[];
    onCloseModal: () => void;
    onUpdateProduct: (id: number, field: keyof ProcurementProductItem, value: any) => void;
}

export function ProcurementItemModals({
    form,
    activeModal,
    taxGroups,
    units,
    onCloseModal,
    onUpdateProduct,
}: ProcurementItemModalsProps) {
    const { t } = useTranslation();
    const activeProduct = form.data.products.find(
        (p) => p.id === activeModal.product_id || p.product_id === activeModal.product_id,
    );
    const targetId = activeModal.product_id as number;

    return (
        <>
            {/* Options Modal */}
            <Dialog open={activeModal.type === 'options'} onOpenChange={onCloseModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Options')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <FormField
                            label={t('Expiration Date')}
                            description={t('Define when that specific product should expire.')}
                        >
                            <DatePicker
                                onDateChange={(value) => onUpdateProduct(targetId, 'expiration_date', value)}
                                date={activeProduct?.expiration_date || null}
                            />
                        </FormField>

                        <div>
                            <Label className="mb-2 block text-sm font-medium">{t('Barcode')}</Label>
                            <div className="bg-muted/40 border-input flex h-16 items-center justify-center rounded border">
                                <span className="text-muted-foreground text-sm">{t('Barcode will be generated')}</span>
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {t('Renders the automatically generated barcode.')}
                            </p>
                        </div>

                        <FormField
                            label={t('Tax Type')}
                            description={t('Adjust how tax is calculated on the item.')}
                        >
                            <Select
                                value={activeProduct?.tax_type || 'inclusive'}
                                onValueChange={(value) => onUpdateProduct(targetId, 'tax_type', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('Select an option')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inclusive">{t('Inclusive')}</SelectItem>
                                    <SelectItem value="exclusive">{t('Exclusive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Unit Modal */}
            <Dialog open={activeModal.type === 'unit'} onOpenChange={onCloseModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {activeProduct?.name || t('Product')}: {t('Purchase Unit')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-muted rounded-lg border p-3">
                            <p className="text-sm text-blue-500">{t('The product will be procured on that unit.')}</p>
                        </div>

                        <FormField label="" description="">
                            <Select
                                value={activeProduct?.unit_id?.toString() || ''}
                                onValueChange={(value) => onUpdateProduct(targetId, 'unit_id', +value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('Select an option')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeProduct?.unit_quantities?.map((unit: any) => (
                                        <SelectItem key={unit.unit_id} value={unit.unit_id.toString()}>
                                            {unit.unit?.name || unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tax Modal */}
            <Dialog open={activeModal.type === 'tax'} onOpenChange={onCloseModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Choose Tax')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-muted rounded-lg border p-3">
                            <p className="text-sm text-blue-500">{t('The tax will be assigned to the procured product.')}</p>
                        </div>

                        <FormField label="" description="">
                            <Select
                                value={activeProduct?.tax_group_id?.toString() || ''}
                                onValueChange={(value) => {
                                    onUpdateProduct(targetId, 'tax_group_id', +value);
                                    onUpdateProduct(
                                        targetId,
                                        'tax_value',
                                        taxGroups.find((group) => group.id === +value)?.name || 0,
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('Select an option')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxGroups.map((group) => (
                                        <SelectItem key={group.id} value={group.id.toString()}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Convert Modal */}
            <Dialog open={activeModal.type === 'convert'} onOpenChange={onCloseModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Convert to unit')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <FormField label="" description="">
                            <Select
                                value={activeProduct?.convert_unit_id?.toString() || ''}
                                onValueChange={(value) => {
                                    onUpdateProduct(targetId, 'convert_unit_id', +value);
                                    onUpdateProduct(
                                        targetId,
                                        'convert_unit_label',
                                        units.find((unit) => unit.id === +value)?.name || '',
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('Select an option')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id.toString()}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
