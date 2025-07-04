import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Groups', href: '/dashboard/units/groups' },
];

export default function CreateProductPage() {
  const { provider } = usePage<{ provider: Provider }>().props;
  const form = useForm({
    first_name: provider.first_name,
    last_name: provider.last_name,
    address_1: provider.address_1,
    address_2: provider.address_2,
    description: provider.description,
    email: provider.email,
    phone: provider.phone,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value });
    // @ts-ignore
    if (form.errors[name]) form.clearErrors(name);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    form.transform(() => ({
      first_name: form.data.first_name,
      general: {
        last_name: form.data.last_name,
        description: form.data.description,
        address_1: form.data.address_1,
        address_2: form.data.address_2,
        email: form.data.email,
        phone: form.data.phone,
      },
    }));

    form.put(`/api/crud/ns.providers/${provider.id}`, {
      preserveScroll: true,
      onError: (errors) => {
        console.error('Validation errors:', errors);
        toast.error('Please fix the validation errors');
      },
      onSuccess: () => {
        toast.success('Role created successfully');
      },
    });
  };

  const validateForm = () => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.first_name.trim()) {
      form.setError('first_name', 'Role name is required');
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'Create a new unit group - JGREM'} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Create a new provider"
            description="Create a new provider and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField label="First Name" error={form.errors.first_name} description="Provide a name to the resource." className="mb-6">
            <Input
              id="first_name"
              name="first_name"
              onChange={handleInputChange}
              value={form.data.first_name}
              className={cn(form.errors.first_name && 'border-destructive')}
              placeholder="Enter Provider name"
              required
            />
          </FormField>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="email"
                htmlFor="email"
                description="Provide the provider email. Might be used to send automated email."
                error={form.errors?.email}
              >
                <Input
                  id="email"
                  name="email"
                  value={form.data.email}
                  onChange={handleInputChange}
                  placeholder="Enter Email"
                  className={form.errors?.email ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="last_name"
                htmlFor="last_name"
                description="Provider last name if necessary."
                error={form.errors?.last_name}
              >
                <Input
                  id="last_name"
                  name="last_name"
                  value={form.data.last_name}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className={form.errors?.last_name ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="phone"
                htmlFor="phone"
                description="Provider last name if necessary."
                error={form.errors?.phone}
              >
                <Input
                  id="phone"
                  name="phone"
                  value={form.data.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className={form.errors?.phone ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="Address 1"
                htmlFor="address_1"
                description="First address of the provider."
                error={form.errors?.phone}
              >
                <Input
                  id="address_1"
                  name="address_1"
                  value={form.data.address_1}
                  onChange={handleInputChange}
                  placeholder="First address of the provider."
                  className={form.errors?.address_1 ? "border-red-500" : ""}
                />
              </FormField>


              <FormField
                label="Address 2"
                htmlFor="address_2"
                description="Second address of the provider."
                error={form.errors?.address_2}
              >
                <Input
                  id="address_2"
                  name="address_2"
                  value={form.data.address_2 || ""}
                  onChange={handleInputChange}
                  placeholder="Second address of the provider."
                  className={form.errors?.address_2 ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="description"
                description="Provide more details about what this role is about."
                error={form.errors?.description}
              >
                <Textarea
                  id="description"
                  name="description"
                  value={form.data.description || ""}
                  onChange={handleInputChange}
                  placeholder="Enter Role description"
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


