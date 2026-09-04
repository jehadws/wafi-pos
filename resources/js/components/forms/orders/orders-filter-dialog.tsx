import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/forms/shared/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

type Props = {
    isFilterOpen: boolean;
    setIsFilterOpen: (value: boolean) => void;
    handleResetFilters: () => void;
    handleFilter: (filters: any) => void;
};

export default function OrderFilterDialog({ isFilterOpen, setIsFilterOpen, handleResetFilters, handleFilter }: Props) {
    const { customers, users, registers } = usePage<{
        orders: Order[];
        customers: Customer[];
        users: { id: number; username: string }[];
        registers: { id: number; name: string }[];
    }>().props;
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [PaymentStatus, setSelectedPaymentStatus] = useState<string | undefined>(undefined);
    const [Author, setSelectedAuthor] = useState<string | undefined>(undefined);
    const [Customer, setSelectedCustomer] = useState<string | undefined>(undefined);
    const [Register, setSelectedRegister] = useState<string | undefined>(undefined);
    const [CustomerPhone, setSelectedCustomerPhone] = useState<string | undefined>(undefined);
    const { t } = useTranslation();

    const handleApplyFilter = () => {
        const queryFilters = {
            'subul_orders.created_at': {
                startDate: dateRange?.from ? format(dateRange?.from!, 'yyyy-MM-dd HH:mm:ss') : null,
                endDate: dateRange?.to ? format(dateRange?.to!, 'yyyy-MM-dd HH:mm:ss') : null,
            },
            payment_status: PaymentStatus ? PaymentStatus : null,
            'subul_orders.author': Author ? Author : null,
            customer_id: Customer ? Customer : null,
            register_id: Register ? Register : null,
            customer_phone: CustomerPhone ? CustomerPhone : null,
        };
        handleFilter(queryFilters);
    };

    const handleApplyReset = () => {
        handleResetFilters();
        setDateRange(undefined);
        setSelectedPaymentStatus(undefined);
        setSelectedAuthor(undefined);
        setSelectedCustomer(undefined);
        setSelectedRegister(undefined);
        setSelectedCustomerPhone(undefined);
    };

    return (
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogContent className={cn('flex w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
                <DialogTitle>{t('Search Filters')}</DialogTitle>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label={t('Payment Status')}>
                        <Select value={PaymentStatus} onValueChange={setSelectedPaymentStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Payment Status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">{t('Paid')}</SelectItem>
                                <SelectItem value="pending">{t('Pending')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label={t('Author')}>
                        <Select value={Author} onValueChange={setSelectedAuthor}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Author')} />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((customer) => {
                                    return (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.username}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label={t('Customer')}>
                        <Select value={Customer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Customer')} />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => {
                                    return (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.first_name} {customer.last_name}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label={t('Customer Phone')}>
                        <Input
                            type="text"
                            placeholder={t('Customer Phone')}
                            className={cn('bg-dark')}
                            value={CustomerPhone}
                            onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                        />
                    </FormField>

                    <FormField label={t('Cash Register')}>
                        <Select value={Register} onValueChange={setSelectedRegister}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Cash Register')} />
                            </SelectTrigger>
                            <SelectContent>
                                {registers.map((register) => {
                                    return (
                                        <SelectItem key={register.id} value={register.id.toString()}>
                                            {register.name}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>

                <DialogFooter>
                    <div className="mt-2 flex w-full flex-row items-center justify-between">
                        <Button onClick={handleApplyReset} variant={'destructive'}>
                            {t('Reset')}
                        </Button>
                        <Button onClick={handleApplyFilter}>{t('Apply')}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
