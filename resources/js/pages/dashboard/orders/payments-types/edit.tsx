import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { RadioGroup } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { paymentTypesApi } from '@/api';
import { extractValidationErrors } from '@/utils/api-errors';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';


export default function EditPaymentType() {
  const { t } = useTranslation();
  const { paymentType } = usePage<{ paymentType: PaymentType }>().props;
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Payment Types'), href: '/dashboard/orders/payments-types' },
    { title: t('Edit payment type'), href: '/dashboard/orders/payments-types/edti' },
  ];
  const form = useForm({
    label: paymentType.label,
    active: paymentType.active,
    priority: paymentType.priority,
    identifier: paymentType.identifier,
    description: paymentType.description,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: keyof typeof form.data, value: string | number | number[]) => {
    form.setData({ ...form.data, [name]: value });

    // @ts-ignore
    if (form.errors[name]) form.clearErrors(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep() || isSubmitting) return;
    setIsSubmitting(true);

    const data = {
      label: form.data.label,
      general: {
        identifier: form.data.identifier,
        description: form.data.description,
        priority: +form.data.priority,
        active: +form.data.active,
      },
    };

    try {
      const res = await paymentTypesApi.update(paymentType.id, data);
      toast.info(t('Successfully saved'));
      if (res?.redirect) router.visit(res.redirect);
    } catch (err) {
      const errors = extractValidationErrors(err);
      console.error('Validation errors:', errors);
      if (errors.error) {
        alert(errors.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = () => {
    let isValid = true;
    form.clearErrors();
    if (!form.data.label.trim()) {
      form.setError('label', t('label is required'));
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit payment type')} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit payment type')}
            description={t('Modify  Payment Type.')}
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={{ ...form, processing: isSubmitting || form.processing }}
          />

          <FormField label={t('Label')} error={form.errors.label} description={t('Provide a label to the resource.')} required>
            <Input
              id="label"
              name="label"
              value={form.data.label || ''}
              onChange={(e) => handleInputChange('label', e.target.value)}
              className={cn(form.errors.label && 'border-destructive')}
              required
            />
          </FormField>
          <Separator />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label={t('Active')} error={form.errors.active} required>
              <RadioGroup
                defaultValue={form.data.active.toString()}
                value={form.data.active === 1 ? '1' : '0'}
                onValueChange={(value) => handleInputChange('active', +value)}
                className="flex gap-6 py-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={`1`} id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer">
                    {t('Yes')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={`0`} id="no" />
                  <Label htmlFor="no" className="cursor-pointer">
                    {t('No')}
                  </Label>
                </div>
              </RadioGroup>
            </FormField>

            <FormField label={t('Label')} error={form.errors.label} description={t('Provide a label to the resource.')} required>
              <Input
                id="priority"
                name="priority"
                type="number"
                value={form.data.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className={cn(form.errors.priority && 'border-destructive')}
              />
            </FormField>

            <FormField label={t('Identifier')} error={form.errors.identifier}>
              <Input
                id="identifier"
                name="identifier"
                value={form.data.identifier || ''}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                className={cn(form.errors.identifier && 'border-destructive')}
              />
            </FormField>

            <FormField label={t('Description')} error={form.errors.description}>
              <Textarea
                id="description"
                name="description"
                rows={5}
                value={form.data.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={cn(form.errors.description && 'border-destructive')}
              />
            </FormField>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
