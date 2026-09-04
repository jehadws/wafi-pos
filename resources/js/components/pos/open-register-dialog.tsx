import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cashRegistersApi, ApiRegister } from '@/api';
import { useRegisterStore } from '@/hooks/pos/use-register-store';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface OpenRegisterDialogProps {
    /** Called after a register is successfully opened — unblocks the POS. */
    onOpened: () => void;
}

/**
 * Blocks the POS until the cashier opens (or joins) a cash register.
 * Shown on POS load when `sb_subul_registers_enabled === 'yes'` and no
 * register is currently opened by the logged user.
 */
export function OpenRegisterDialog({ onOpened }: OpenRegisterDialogProps) {
    const { t } = useTranslation();
    const openRegister = useRegisterStore((s) => s.openRegister);
    const [registers, setRegisters] = useState<ApiRegister[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadRegisters = async () => {
        try {
            const all = await cashRegistersApi.getRegisters();
            const available = all.filter(
                (r) => r.status !== 'disabled' && r.used_by === null,
            );
            setRegisters(available);
            if (available.length > 0) {
                setSelectedId(String(available[0].id));
            }
        } catch (error: any) {
            toast.error(error?.message || t('Unable to load cash registers.'));
        }
    };

    useEffect(() => {
        loadRegisters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async () => {
        if (!selectedId) {
            toast.warning(t('Please select a register.'));
            return;
        }
        const openingAmount = parseFloat(amount || '0');
        if (isNaN(openingAmount) || openingAmount < 0) {
            toast.warning(t('Please provide a valid opening amount.'));
            return;
        }

        setSubmitting(true);
        try {
            await openRegister(+selectedId, openingAmount, description || undefined);
            toast.success(t('The register has been successfully opened'));
            onOpened();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                    error?.message ||
                    t('Unable to open the register.'),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t('Open Cash Register')}</DialogTitle>
                    <DialogDescription>
                        {t('Select a register and count the opening cash to start selling.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="register-select">{t('Register')}</Label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger id="register-select" className="w-full">
                                <SelectValue
                                    placeholder={
                                        registers.length === 0
                                            ? t('No registers are available.')
                                            : t('Select a register')
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {registers.map((register) => (
                                    <SelectItem key={register.id} value={String(register.id)}>
                                        {register.name}
                                        {register.balance > 0 && (
                                            <> · {formatCurrency(register.balance)}</>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="opening-amount">{t('Opening Amount')}</Label>
                        <Input
                            id="opening-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="opening-description">{t('Description')}</Label>
                        <Input
                            id="opening-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('Further observation while proceeding.')}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={submitting || !selectedId}>
                        {submitting ? (
                            <>
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                {t('Opening…')}
                            </>
                        ) : (
                            t('Open Register')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
