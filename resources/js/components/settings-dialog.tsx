'use client';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: { orderName: string; createdAt: string }) => void;
    initialSettings?: {
        orderName: string;
        createdAt: string;
    };
}

export default function SettingsDialog({
    isOpen,
    onClose,
    onSave,
    initialSettings = {
        orderName: '',
        createdAt: format(new Date(), 'MM-dd-yyyy'),
    },
}: SettingsDialogProps) {
    const { t } = useTranslation();
    const [orderName, setOrderName] = useState(initialSettings.orderName);
    const [createdAt, setCreatedAt] = useState(initialSettings.createdAt);

    const handleSave = () => {
        onSave({
            orderName,
            createdAt,
        });
        toast.success(t('Order settings saved'));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Order Settings')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="order-name">{t('Name')}</Label>
                        <Input id="order-name" value={orderName} onChange={(e) => setOrderName(e.target.value)} placeholder={t('Enter order name')} />
                        <p className="text-muted-foreground text-sm">{t('Define the order name.')}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="created-at">{t('Created At')}</Label>
                        <DatePicker
                            date={createdAt ? new Date(createdAt) : undefined}
                            onDateChange={(date) => date && setCreatedAt(format(date, 'MM-dd-yyyy'))}
                        />

                        <p className="text-muted-foreground text-sm">{t('Define the date of creation of the order.')}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave}>{t('Save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
