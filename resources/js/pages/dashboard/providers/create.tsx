import { providersApi } from '@/api';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, router } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const { t } = useTranslation();

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Providers'), href: '/dashboard/providers' },
    { title: t('Create Provider'), href: '/dashboard/providers/create' },
  ];
  const form = useForm({
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    description: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
      const res = await providersApi.create({
        first_name: form.data.first_name,
        general: {
          last_name: form.data.last_name,
          description: form.data.description,
          address_1: form.data.address_1,
          address_2: form.data.address_2,
          email: form.data.email,
          phone: form.data.phone,
        },
      });
      toast.success(t('Provider created successfully'));
      router.visit(res?.redirect || route('sb.dashboard.providers'));
    } catch {
      toast.error(t('Please fix the validation errors'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.first_name.trim()) {
      form.setError('first_name', t('This field is required'));
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Create Provider')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Create a new provider')}
            description={t('Register a new provider and save it.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={{ ...form, processing: isSubmitting || form.processing }}
          />

          <FormField label={t('First Name')} error={form.errors.first_name} description={t('Provide a name to the resource.')} className="mb-6">
            <Input
              id="first_name"
              name="first_name"
              onChange={handleInputChange}
              className={cn(form.errors.first_name && 'border-destructive')}
              placeholder={t('Enter Provider name')}
              required
            />
          </FormField>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                label={t('Email')}
                htmlFor="email"
                description={t('Provide the provider email. Might be used to send automated email.')}
                error={form.errors?.email}
              >
                <Input
                  id="email"
                  name="email"
                  value={form.data.email}
                  onChange={handleInputChange}
                  placeholder={t('Enter Email')}
                  className={form.errors?.email ? 'border-red-500' : ''}
                />
              </FormField>

              <FormField
                label={t('Last Name')}
                htmlFor="last_name"
                description={t('Further details about the provider')}
                error={form.errors?.last_name}
              >
                <Input
                  id="last_name"
                  name="last_name"
                  value={form.data.last_name}
                  onChange={handleInputChange}
                  placeholder={t('Enter last name')}
                  className={form.errors?.last_name ? 'border-red-500' : ''}
                />
              </FormField>

              <FormField
                label={t('Phone')}
                htmlFor="phone"
                description={t('Contact phone number for the provider. Might be used to send automated SMS notifications.')}
                error={form.errors?.phone}
              >
                <Input
                  id="phone"
                  name="phone"
                  value={form.data.phone}
                  onChange={handleInputChange}
                  placeholder={t('Enter phone number')}
                  className={form.errors?.phone ? 'border-red-500' : ''}
                />
              </FormField>

              <FormField label={t('First Address')} htmlFor="address_1" description={t('First address of the provider.')} error={form.errors?.phone}>
                <Input
                  id="address_1"
                  name="address_1"
                  value={form.data.address_1}
                  onChange={handleInputChange}
                  placeholder={t('First address of the provider.')}
                  className={form.errors?.address_1 ? 'border-red-500' : ''}
                />
              </FormField>

              <FormField
                label={t('Second Address')}
                htmlFor="address_2"
                description={t('Second address of the provider.')}
                error={form.errors?.address_2}
              >
                <Input
                  id="address_2"
                  name="address_2"
                  value={form.data.address_2}
                  onChange={handleInputChange}
                  placeholder={t('Second address of the provider.')}
                  className={form.errors?.address_2 ? 'border-red-500' : ''}
                />
              </FormField>

              <FormField
                label={t('Description')}
                htmlFor="description"
                description={t('Provide more details about what this role is about.')}
                error={form.errors?.description}
              >
                <Textarea
                  id="description"
                  name="description"
                  value={form.data.description}
                  onChange={handleInputChange}
                  placeholder={t('Enter Role description')}
                  rows={4}
                />
              </FormField>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
