'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { taxesApi } from '@/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TaxGroup {
    id: number;
    name: string;
    taxes?: { rate: number }[];
}

interface TaxesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taxGroupId: number | null, taxType: string) => void;
    currentTaxGroupId: number | null;
    currentTaxType: string;
}

export default function TaxesDialog({ isOpen, onClose, onSave, currentTaxGroupId, currentTaxType }: TaxesDialogProps) {
    const { t } = useTranslation();
    const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string>(currentTaxGroupId?.toString() ?? 'none');
    const [selectedType, setSelectedType] = useState(currentTaxType || 'inclusive');

    // Reload dialog selections when opened or props change
    useEffect(() => {
        setSelectedGroupId(currentTaxGroupId?.toString() ?? 'none');
        setSelectedType(currentTaxType || 'inclusive');
    }, [currentTaxGroupId, currentTaxType, isOpen]);

    // Fetch tax groups when dialog opens
    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        taxesApi
            .getGroups()
            .then((data) => {
                // API may return array directly or paginated { data: [] }
                const list = Array.isArray(data) ? data : (data?.data ?? []);
                setTaxGroups(list);
            })
            .catch(() => {
                toast.error(t('Failed to load tax groups'));
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const selectedGroup = taxGroups.find((g) => g.id.toString() === selectedGroupId);
    const summarizedRate = selectedGroup?.taxes?.reduce((acc, t) => acc + t.rate, 0) ?? 0;

    const handleSave = () => {
        const groupId = selectedGroupId === 'none' ? null : Number(selectedGroupId);
        onSave(groupId, selectedType);
        toast.success(t('Tax settings saved'));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Tax Settings')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Tax Group */}
                    <div className="space-y-2">
                        <Label htmlFor="tax-group">{t('Tax Group')}</Label>
                        {loading ? (
                            <p className="text-muted-foreground text-sm">{t('Loading…')}</p>
                        ) : (
                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <SelectTrigger id="tax-group">
                                    <SelectValue placeholder={t('Select a tax group')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('None')}</SelectItem>
                                    {taxGroups.map((group) => (
                                        <SelectItem key={group.id} value={group.id.toString()}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <p className="text-muted-foreground text-sm">{t('The tax group applied to the order.')}</p>
                    </div>

                    {/* Tax Type */}
                    <div className="space-y-2">
                        <Label htmlFor="tax-type">{t('Tax Type')}</Label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger id="tax-type">
                                <SelectValue placeholder={t('Select tax type')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inclusive">{t('Inclusive')}</SelectItem>
                                <SelectItem value="exclusive">{t('Exclusive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-sm">{t('Defines how the tax is applied to product prices.')}</p>
                    </div>

                    {/* Summary */}
                    {selectedGroup && (
                        <div className="bg-muted rounded-md p-3 text-sm">
                            <p className="font-medium">{selectedGroup.name}</p>
                            <p className="text-muted-foreground">
                                {t('Combined rate')}: {summarizedRate}% &middot; {selectedType}
                            </p>
                        </div>
                    )}
                </div>

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
