'use client';

import FormField from '@/components/forms/shared/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/lib/i18n';
import type { ExpiryTabProps, ProductFormData } from './types';

export default function ExpiryTab({ form, handleInputChange }: ExpiryTabProps) {
    const { t } = useTranslation();
    const handleChange = (name: keyof ProductFormData, value: string | number | number[]) => {
        handleInputChange(name, value);

        if (form.errors[name]) form.clearErrors(name);
        if (form.errors.expiracy_error) form.clearErrors('expiracy_error');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Expiry Settings')}</CardTitle>
                <CardDescription>{t('Configure product expiration settings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Switch
                        checked={form.data.expiracy_expires}
                        onCheckedChange={(checked) => handleChange('expiracy_expires', checked)}
                        id="expiracy_expires"
                    />
                    <Label htmlFor="expiracy_expires">{t('Product Expires')}</Label>
                </div>

                <FormField label={t('On Expiration')} htmlFor="expiracy_on_expiration" error={form.errors?.expiracy_on_expiration}>
                    <Select
                        value={form.data.expiracy_on_expiration}
                        onValueChange={(value: 'allow_sales' | 'prevent_sales') => handleChange('expiracy_on_expiration', value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="allow_sales">{t('Allow Sales')}</SelectItem>
                            <SelectItem value="prevent_sales">{t('Prevent Sales')}</SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>
            </CardContent>
        </Card>
    );
}
