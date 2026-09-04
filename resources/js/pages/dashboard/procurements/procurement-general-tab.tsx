import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import ToggleButtons from '@/components/forms/shared/toggle-buttons';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { ProcurementFormData } from './use-procurement-form';

const DeliveryStatus = [
    { value: 'delivered', label: 'Delivered' },
    { value: 'pending', label: 'Pending' },
];

const PaymentStatus = [
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
];

interface ProcurementGeneralTabProps {
    form: {
        data: ProcurementFormData;
        errors: Partial<Record<keyof ProcurementFormData, string>>;
    };
    providers: { id: number; name: string }[];
    handleInputChange: (name: keyof ProcurementFormData, value: any) => void;
}

export function ProcurementGeneralTab({ form, providers, handleInputChange }: ProcurementGeneralTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
                label={t('Invoice Number')}
                htmlFor="general_invoice_reference"
                description={t('If the procurement has been issued outside of Subul POS, please provide a unique reference.')}
                error={form.errors?.general_invoice_reference}
            >
                <Input
                    id="general_invoice_reference"
                    name="general_invoice_reference"
                    value={form.data.general_invoice_reference}
                    onChange={(e) => handleInputChange('general_invoice_reference', e.target.value)}
                    className={form.errors?.general_invoice_reference ? 'border-red-500' : ''}
                />
            </FormField>

            <FormField
                label={t('Delivery Time')}
                htmlFor="general_delivery_time"
                description={t('If the procurement has to be delivered at a specific time, define the moment here.')}
                error={form.errors?.general_delivery_time}
            >
                <DatePicker
                    onDateChange={(value) => handleInputChange('general_delivery_time', value)}
                    date={form.data.general_delivery_time}
                />
            </FormField>

            <FormField
                label={t('Invoice Date')}
                htmlFor="general_invoice_date"
                description={t('If you would like to define a custom invoice date.')}
                error={form.errors?.general_invoice_date}
            >
                <DatePicker
                    onDateChange={(value) => handleInputChange('general_invoice_date', value)}
                    date={form.data.general_invoice_date}
                />
            </FormField>

            <FormField
                label={t('Automatic Approval')}
                htmlFor="general_automatic_approval"
                description={t('Determine if the procurement should be marked automatically as approved once the Delivery Time occurs.')}
                error={form.errors.general_automatic_approval ? String(form.errors.general_automatic_approval) : undefined}
            >
                <ToggleButtons
                    value={form.data.general_automatic_approval === 1}
                    onChange={(value) => handleInputChange('general_automatic_approval', value ? 1 : 0)}
                />
            </FormField>

            <FormField
                label={t('Delivery Status')}
                htmlFor="general_delivery_status"
                description={t('Determine what is the actual value of the procurement. Once "Delivered" the status can\'t be changed, and the stock will be updated.')}
                error={form.errors?.general_delivery_status}
            >
                <Select
                    value={form.data.general_delivery_status}
                    onValueChange={(value) => handleInputChange('general_delivery_status', value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Not set')} />
                    </SelectTrigger>
                    <SelectContent>
                        {DeliveryStatus.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {t(status.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label={t('Payment Status')}
                htmlFor="general_payment_status"
                description={t('Determine what is the actual payment status of the procurement.')}
                error={form.errors?.general_payment_status}
            >
                <Select
                    value={form.data.general_payment_status}
                    onValueChange={(value) => handleInputChange('general_payment_status', value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Not set')} />
                    </SelectTrigger>
                    <SelectContent>
                        {PaymentStatus.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {t(status.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label={t('Provider')}
                htmlFor="general_provider_id"
                description={t('Determine what is the actual provider of the current procurement.')}
                error={form.errors?.general_provider_id}
            >
                <Select
                    value={form.data.general_provider_id.toString()}
                    onValueChange={(value) => handleInputChange('general_provider_id', +value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Not set')} />
                    </SelectTrigger>
                    <SelectContent>
                        {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
