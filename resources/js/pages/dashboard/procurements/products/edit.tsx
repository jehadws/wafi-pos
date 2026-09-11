import { procurementsApi } from '@/api';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { extractValidationErrors } from '@/utils/api-errors';
import { Head, router, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const { t } = useTranslation();
  const { product } = usePage<{ product: ProcurementProduct }>().props;
  const form = useForm({
    name: product.name,
    expiration_date: product.expiration_date,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Procurement Products'), href: '/dashboard/procurements/products' },
    { title: t('Edit Procurement Products'), href: '/dashboard/procurements/products/edit' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value });
    // @ts-expect-error Inertia form type
    if (form.errors[name]) form.clearErrors(name);
  };

  const handleSelectChange = (name: string, value: string | number | number[]) => {
    form.setData({ ...form.data, [name]: value });
    // @ts-expect-error Inertia form type
    if (form.errors[name]) form.clearErrors(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await procurementsApi.updateProduct(product.id, {
        name: form.data.name,
        general: {
          expiration_date: form.data.expiration_date,
        },
      });
      toast.success(t('Procurement product updated successfully'));
      if (res?.redirect) router.visit(res.redirect);
    } catch (err) {
      const errors = extractValidationErrors(err);
      console.error('Validation errors:', errors);
      toast.error(t('Please fix the validation errors'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.name.trim()) {
      form.setError('name', t('Name is required'));
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit procurement product')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit procurement product')}
            description={t('Modify Procurement Product and save it.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={{ ...form, processing: isSubmitting || form.processing }}
          />

          <FormField required label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6">
            <Input
              id="name"
              name="name"
              onChange={handleInputChange}
              value={form.data.name}
              className={cn(form.errors.name && 'border-destructive')}
              required
            />
          </FormField>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label={t('Expiration Date')} description={t('Define when that specific product should expire.')}>
                <DatePicker
                  onDateChange={(value: Date | undefined) => handleSelectChange('expiration_date', value ? value.toISOString() : '')}
                  // @ts-expect-error Inertia form type
                  date={form.data.expiration_date}
                />
              </FormField>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
