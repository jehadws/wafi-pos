import { rolesApi } from '@/api';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { extractValidationErrors } from '@/utils/api-errors';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const { t } = useTranslation();
  const form = useForm({
    name: '',
    namespace: '',
    description: '',
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
      const res = await rolesApi.create({
        name: form.data.name,
        general: {
          namespace: form.data.namespace,
          description: form.data.description,
        },
      });
      toast.success(t('Role created successfully'));
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
      form.setError('name', t('Role name is required'));
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Roles'), href: '/dashboard/users/roles' },
      ]}
    >
      <Head title={t('Create a new role')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Create a new role')}
            description={t('Create a new role and save it.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={{ ...form, processing: isSubmitting || form.processing }}
          />

          <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the role.')} className="mb-6">
            <Input
              id="name"
              name="name"
              onChange={handleInputChange}
              className={cn(form.errors.name && 'border-destructive')}
              placeholder={t('Enter Role name')}
              required
            />
          </FormField>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label={t('Namespace')}
                htmlFor="namespace"
                description={t('Should be a unique value with no spaces or special character')}
                error={form.errors?.namespace}
              >
                <Input
                  id="namespace"
                  name="namespace"
                  value={form.data.namespace}
                  onChange={handleInputChange}
                  placeholder={t('Enter namespace')}
                  className={form.errors?.namespace ? 'border-red-500' : ''}
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
