import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/utils/format';
import { ordersApi } from '@/api';
import { isAxiosError } from 'axios';
import { Banknote, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '../../../lib/i18n';

type Payment = {
    identifier: string;
    label: string;
};

type Props = {
    order: Order | null;
    onSuccess?: () => void;
};

const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) return error.response?.data?.message || error.message;
    if (error instanceof Error) return error.message;
    return String(error);
};

export default function OrderInstalmentsTab({ order, onSuccess }: Props) {
    const { t } = useTranslation();
    const [instalments, setInstalments] = useState<OrderInstalment[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newAmount, setNewAmount] = useState('');
    const [newDate, setNewDate] = useState('');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState('');

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [payId, setPayId] = useState<number | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    const refetch = useCallback(async () => {
        if (!order?.id) return;
        setLoading(true);
        try {
            const data = await ordersApi.instalments.list(order.id);
            setInstalments(data ?? []);
        } catch (error) {
            toast.error(t('Unable to load instalments'), {
                description: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    }, [order?.id, t]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const handleAfterChange = () => {
        refetch();
        onSuccess?.();
    };

    const totalScheduled = instalments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    const totalPaid = instalments.filter((inst) => inst.paid).reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    const remaining = totalScheduled - totalPaid;

    const getInstalmentStatus = (instalment: OrderInstalment) => {
        if (instalment.paid) return { label: t('Paid'), variant: 'success' as const };
        if (new Date(instalment.date) < new Date(new Date().toDateString()))
            return { label: t('Overdue'), variant: 'error' as const };
        return { label: t('Upcoming'), variant: 'info' as const };
    };

    const handleAddInstalment = async () => {
        if (!order?.id || isSubmitting) return;
        if (!newAmount || parseFloat(newAmount) <= 0) return toast.warning(t('Please provide a valid amount.'));
        if (!newDate) return toast.warning(t('Please provide a due date.'));

        setIsSubmitting(true);
        try {
            await ordersApi.instalments.create(order.id, {
                amount: parseFloat(newAmount),
                date: newDate,
            });
            toast.success(t('The instalment has been successfully created.'));
            setNewAmount('');
            setNewDate('');
            handleAfterChange();
        } catch (error) {
            toast.error(t('Unable to proceed'), {
                description: getErrorMessage(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartEdit = (instalment: OrderInstalment) => {
        setEditingId(instalment.id);
        setEditAmount(String(instalment.amount));
        setEditDate(instalment.date?.slice(0, 10) || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditAmount('');
        setEditDate('');
    };

    const handleUpdateInstalment = async (instalment: OrderInstalment) => {
        if (!order?.id || isSubmitting) return;
        if (!editAmount || parseFloat(editAmount) <= 0) return toast.warning(t('Please provide a valid amount.'));
        if (!editDate) return toast.warning(t('Please provide a due date.'));

        setIsSubmitting(true);
        try {
            await ordersApi.instalments.update(order.id, instalment.id, {
                amount: parseFloat(editAmount),
                date: editDate,
            });
            toast.success(t('The instalment has been successfully updated.'));
            handleCancelEdit();
            handleAfterChange();
        } catch (error) {
            toast.error(t('Unable to proceed'), {
                description: getErrorMessage(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInstalment = async (instalment: OrderInstalment) => {
        if (!order?.id || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await ordersApi.instalments.delete(order.id, instalment.id);
            toast.success(t('The instalment has been successfully deleted.'));
            setDeleteId(null);
            handleAfterChange();
        } catch (error) {
            toast.error(t('Unable to proceed'), {
                description: getErrorMessage(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayPopoverChange = (instalmentId: number, open: boolean) => {
        setPayId(open ? instalmentId : null);
        if (!open || payments.length > 0) return;
        setLoadingPayments(true);
        ordersApi
            .getPayments()
            .then((response) => setPayments(response[0]?.options || []))
            .catch(() => setPayments([]))
            .finally(() => setLoadingPayments(false));
    };

    const handlePayInstalment = async (instalment: OrderInstalment, payment_type?: string) => {
        if (!order?.id || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await ordersApi.instalments.pay(order.id, instalment.id, payment_type);
            toast.success(t('The instalment has been successfully paid.'));
            setPayId(null);
            handleAfterChange();
        } catch (error) {
            toast.error(t('Unable to proceed'), {
                description: getErrorMessage(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!order) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/60 border-primary flex items-center justify-between rounded border p-3">
                    <span className="font-medium">{t('Total Scheduled')}</span>
                    <span className="font-semibold">{formatCurrency(totalScheduled)}</span>
                </div>
                <div className="bg-success/30 border-success/60 flex items-center justify-between rounded border p-3">
                    <span className="font-medium">{t('Total Paid')}</span>
                    <span className="font-semibold">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="bg-error/30 border-error flex items-center justify-between rounded border p-3">
                    <span className="font-medium">{t('Remaining')}</span>
                    <span className="font-semibold">{formatCurrency(remaining)}</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span>{t('Add Instalment')}</span>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={t('Amount')}
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="flex-1"
                    />
                    <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleAddInstalment} disabled={isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                        {t('Add')}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <div>{t('Instalments')}</div>
                <Separator />
                <div className="max-h-[400px] space-y-2 overflow-y-auto">
                    {loading && instalments.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <LoaderCircle className="text-muted-foreground h-6 w-6 animate-spin" />
                        </div>
                    ) : instalments.length === 0 ? (
                        <div className="py-8 text-center text-sm">{t('No instalments scheduled for this order.')}</div>
                    ) : (
                        [...instalments]
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((instalment) => {
                                const status = getInstalmentStatus(instalment);
                                const isEditing = editingId === instalment.id;

                                return (
                                    <div
                                        key={instalment.id}
                                        className="bg-muted/40 border-muted flex items-center justify-between gap-2 rounded border p-3"
                                    >
                                        {isEditing ? (
                                            <>
                                                <div className="flex flex-1 items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editAmount}
                                                        onChange={(e) => setEditAmount(e.target.value)}
                                                        className="w-28"
                                                    />
                                                    <Input
                                                        type="date"
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        className="w-40"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button size="sm" onClick={() => handleUpdateInstalment(instalment)} disabled={isSubmitting}>
                                                        {t('Save')}
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={status.variant}>{status.label}</Badge>
                                                    <span className="font-semibold">{formatCurrency(Number(instalment.amount))}</span>
                                                    <span className="text-muted-foreground text-sm">
                                                        {t('Due')} {formatDate(instalment.date)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!instalment.paid && (
                                                        <>
                                                            <Popover
                                                                open={payId === instalment.id}
                                                                onOpenChange={(open) => handlePayPopoverChange(instalment.id, open)}
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Banknote className="h-4 w-4" />
                                                                        {t('Pay')}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-64" align="end">
                                                                    <div className="mb-2 text-sm font-medium">{t('Select Payment Type')}</div>
                                                                    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                                                                        {loadingPayments ? (
                                                                            <div className="flex items-center justify-center py-4">
                                                                                <LoaderCircle className="h-5 w-5 animate-spin" />
                                                                            </div>
                                                                        ) : (
                                                                            [
                                                                                ...payments.map((payment) => (
                                                                                    <Button
                                                                                        key={payment.identifier}
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className="justify-start"
                                                                                        disabled={isSubmitting}
                                                                                        onClick={() => handlePayInstalment(instalment, payment.identifier)}
                                                                                    >
                                                                                        {t(payment.label)}
                                                                                    </Button>
                                                                                )),
                                                                                <Button
                                                                                    key="cash-default"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="justify-start"
                                                                                    disabled={isSubmitting}
                                                                                    onClick={() => handlePayInstalment(instalment)}
                                                                                >
                                                                                    {t('Cash')}
                                                                                </Button>,
                                                                            ]
                                                                        )}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isSubmitting}
                                                                onClick={() => handleStartEdit(instalment)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Popover open={deleteId === instalment.id} onOpenChange={(open) => setDeleteId(open ? instalment.id : null)}>
                                                                <PopoverTrigger asChild>
                                                                    <Button size="sm" variant="destructive" disabled={isSubmitting}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-56" align="end">
                                                                    <div className="mb-3 text-sm">
                                                                        {t('Are you sure you want to delete this instalment?')}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            className="flex-1"
                                                                            disabled={isSubmitting}
                                                                            onClick={() => handleDeleteInstalment(instalment)}
                                                                        >
                                                                            {t('Delete')}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="flex-1"
                                                                            onClick={() => setDeleteId(null)}
                                                                        >
                                                                            {t('Cancel')}
                                                                        </Button>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </>
                                                    )}
                                                    {instalment.paid && <Badge variant="secondary">{t('Settled')}</Badge>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>
        </div>
    );
}
