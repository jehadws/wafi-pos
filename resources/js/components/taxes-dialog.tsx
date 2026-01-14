'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import { toast } from 'sonner';

interface TaxesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taxRate: number, taxType: string) => void;
    currentTaxRate: number;
    currentTaxType: string;
}

export default function TaxesDialog({ isOpen, onClose, onSave, currentTaxRate, currentTaxType }: TaxesDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('settings');
    const [taxRate, setTaxRate] = useState(currentTaxRate.toString());
    const [taxType, setTaxType] = useState(currentTaxType);
    const [isTaxActive, setIsTaxActive] = useState(currentTaxRate > 0);

    const handleSave = () => {
        const parsedRate = Number.parseFloat(taxRate);
        if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
            toast.error(t('Invalid tax rate'), {
                description: t('Please enter a valid tax rate between 0 and 100'),
            });
            return;
        }

        onSave(parsedRate, taxType);
        toast.success(t('Tax settings saved'));
        onClose();
    };

    const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setTaxRate(value);
        setIsTaxActive(Number.parseFloat(value) > 0);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Tax & Summary')}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="settings" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="settings">{t('Settings')}</TabsTrigger>
                        <TabsTrigger value="summary">{t('Summary')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="settings" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="select-tax">{t('Select Tax')}</Label>
                            <Input id="select-tax" type="text" placeholder={t('Tax rate (%)')} value={taxRate} onChange={handleTaxRateChange} />
                            <p className="text-muted-foreground text-sm">{t('Define the tax that apply to the sale.')}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tax-type">{t('Type')}</Label>
                            <Select value={taxType} onValueChange={setTaxType}>
                                <SelectTrigger id="tax-type">
                                    <SelectValue placeholder={t('Select tax type')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">{t('Percentage')}</SelectItem>
                                    <SelectItem value="fixed">{t('Fixed Amount')}</SelectItem>
                                    <SelectItem value="included">{t('Included in Price')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground text-sm">{t('Define how the tax is computed')}</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="summary" className="py-4">
                        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                            {isTaxActive ? (
                                <div className="text-center">
                                    <p className="text-sm font-medium">
                                        {taxType === 'percentage'
                                            ? `${taxRate}% ${t('tax will be applied to all sales')}`
                                            : taxType === 'fixed'
                                              ? `$${taxRate} ${t('fixed tax will be applied to all sales')}`
                                              : `${t('Tax (')}${taxRate}%${t(') is included in the price')}`}
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {t('Tax type:') + ' ' + taxType.charAt(0).toUpperCase() + taxType.slice(1)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">{t('No tax is active')}</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={handleSave}>{t('Save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
