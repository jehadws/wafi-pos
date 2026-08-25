import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { useRegisterStore } from '@/hooks/pos/use-register-store';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { ArrowDownCircle, ArrowUpCircle, Loader2, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RegisterSessionDialogProps {
    /** Called after the register is closed — re-triggers the open-register gate. */
    onClosed?: () => void;
}

type MovementAction = 'cashIn' | 'cashOut';

/**
 * Cash-register session management: session summary + history,
 * cash in / cash out movements and the closing flow with a
 * counted-cash confirmation.
 *
 * Dialog visibility lives in `useRegisterStore.sessionDialogOpen`.
 */
export function RegisterSessionDialog({ onClosed }: RegisterSessionDialogProps) {
    const { t } = useTranslation();
    const options = usePOS((s) => s.options);
    // `ns_jgrem_disbursement === 'yes'` allows the cashier to take cash out.
    const disbursementEnabled = options[POS_OPTION_KEYS.disbursement] === 'yes';
    const open = useRegisterStore((s) => s.sessionDialogOpen);
    const setOpen = (value: boolean) =>
        value ? useRegisterStore.getState().openSessionDialog() : useRegisterStore.getState().closeSessionDialog();
    const {
        currentRegister,
        sessionHistory,
        sessionSummary,
        status,
        loadSessionHistory,
        closeRegister,
        cashIn,
        cashOut,
    } = useRegisterStore();

    const [movementAction, setMovementAction] = useState<MovementAction>('cashIn');
    const [movementAmount, setMovementAmount] = useState('');
    const [movementDescription, setMovementDescription] = useState('');
    const [countedCash, setCountedCash] = useState('');
    const [closingDescription, setClosingDescription] = useState('');
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (open && currentRegister) {
            loadSessionHistory().catch((error: any) => {
                toast.error(error?.response?.data?.message || t('Unable to load the session history.'));
            });
        }
    }, [open, currentRegister?.id]);

    // Pre-fill the expected amount so the cashier only corrects it.
    useEffect(() => {
        if (open && currentRegister) {
            setCountedCash(String(currentRegister.balance ?? 0));
        }
    }, [open, currentRegister?.balance]);

    // Disbursement disabled → fall back to Cash In when the toggle disappears.
    useEffect(() => {
        if (!disbursementEnabled && movementAction === 'cashOut') {
            setMovementAction('cashIn');
        }
    }, [disbursementEnabled, movementAction]);

    const handleMovement = async () => {
        if (!disbursementEnabled && movementAction === 'cashOut') return;

        const amount = parseFloat(movementAmount || '0');
        if (isNaN(amount) || amount <= 0) {
            toast.warning(t('Please provide a valid amount.'));
            return;
        }

        const action = movementAction === 'cashIn' ? cashIn : cashOut;
        try {
            await action(currentRegister!.id, amount, movementDescription || undefined);
            toast.success(
                movementAction === 'cashIn'
                    ? t('The cash has successfully been stored')
                    : t('The cash has successfully been disbursed.'),
            );
            setMovementAmount('');
            setMovementDescription('');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || t('The operation failed.'));
        }
    };

    const handleCloseRegister = async () => {
        const amount = parseFloat(countedCash || '0');
        if (isNaN(amount) || amount < 0) {
            toast.warning(t('Please count the cash drawer before closing.'));
            return;
        }

        setClosing(true);
        try {
            await closeRegister(currentRegister!.id, amount, closingDescription || undefined);
            toast.success(t('The register has been successfully closed'));
            setOpen(false);
            onClosed?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || t('Unable to close the register.'));
        } finally {
            setClosing(false);
        }
    };

    if (!currentRegister) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col gap-0 p-0">
                <DialogHeader className="border-b p-4">
                    <DialogTitle>
                        {t('Register Session')} : {currentRegister.name}
                    </DialogTitle>
                    <DialogDescription>
                        {t('Balance')} : <span className="font-bold">{formatCurrency(currentRegister.balance)}</span>
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="session" className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                    <div className="border-b px-4 pt-2">
                        <TabsList>
                            <TabsTrigger value="session">{t('Session')}</TabsTrigger>
                            <TabsTrigger value="close">{t('Close Register')}</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ── Session tab ─────────────────────────────────── */}
                    <TabsContent value="session" className="mt-0 min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 gap-2">
                            {(sessionSummary ?? []).map((entry) => (
                                <div key={entry.label} className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs">{entry.label}</p>
                                    <p className="text-sm font-semibold">{formatCurrency(entry.value)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 rounded-lg border p-3">
                            <p className="text-sm font-medium">{t('Cash Movements')}</p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={movementAction === 'cashIn' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setMovementAction('cashIn')}
                                >
                                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                                    {t('Cash In')}
                                </Button>
                                {disbursementEnabled && (
                                    <Button
                                        type="button"
                                        variant={movementAction === 'cashOut' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setMovementAction('cashOut')}
                                    >
                                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                                        {t('Cash Out')}
                                    </Button>
                                )}
                            </div>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                inputMode="decimal"
                                placeholder={t('Amount')}
                                value={movementAmount}
                                onChange={(e) => setMovementAmount(e.target.value)}
                            />
                            <Textarea
                                rows={2}
                                placeholder={t('Further observation while proceeding.')}
                                value={movementDescription}
                                onChange={(e) => setMovementDescription(e.target.value)}
                            />
                            <Button className="w-full" onClick={handleMovement} disabled={status === 'cash-moving'}>
                                {status === 'cash-moving' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('Processing…')}
                                    </>
                                ) : (
                                    t('Record Movement')
                                )}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('History')}</p>
                            {(sessionHistory ?? []).length === 0 && (
                                <p className="text-muted-foreground text-sm">{t('No movements recorded yet.')}</p>
                            )}
                            {(sessionHistory ?? [])
                                .slice()
                                .reverse()
                                .map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                        <div className="flex-1">
                                            <p>{entry.label}</p>
                                            {entry.description && (
                                                <p className="text-muted-foreground text-xs">{entry.description}</p>
                                            )}
                                        </div>
                                        <span className="font-semibold">{formatCurrency(entry.value)}</span>
                                    </div>
                                ))}
                        </div>
                    </TabsContent>

                    {/* ── Close tab ───────────────────────────────────── */}
                    <TabsContent value="close" className="mt-0 flex-1 space-y-4 overflow-y-auto p-4">
                        <div className="space-y-2">
                            <Label htmlFor="counted-cash">{t('Counted Cash')}</Label>
                            <Input
                                id="counted-cash"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={countedCash}
                                onChange={(e) => setCountedCash(e.target.value)}
                            />
                            <p className="text-muted-foreground text-xs">
                                {t('Expected')} : {formatCurrency(currentRegister.balance)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="closing-description">{t('Description')}</Label>
                            <Textarea
                                id="closing-description"
                                rows={3}
                                placeholder={t('Further observation while proceeding.')}
                                value={closingDescription}
                                onChange={(e) => setClosingDescription(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleCloseRegister}
                            disabled={closing}
                        >
                            {closing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('Closing…')}
                                </>
                            ) : (
                                <>
                                    <LockKeyhole className="mr-2 h-4 w-4" />
                                    {t('Close Register')}
                                </>
                            )}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
