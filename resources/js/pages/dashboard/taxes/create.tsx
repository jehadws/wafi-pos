import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Groups', href: '/dashboard/units/groups' },
];

export default function CreateProductPage() {
  const { groups } = usePage<{ groups: { name: string; id: number }[] }>().props;
  const form = useForm({
    name: '',
    description: '',
    tax_group_id: '',
    rate: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value });
    // @ts-ignore
    if (form.errors[name]) form.clearErrors(name);
  };

  const handleSelectChange = (name: string, value: string | number | number[]) => {
    form.setData({ ...form.data, [name]: value });
    // @ts-ignore
    if (form.errors[name]) form.clearErrors(name);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    form.transform(() => ({
      name: form.data.name,
      general: {
        description: form.data.description,
        tax_group_id: form.data.tax_group_id,
        rate: form.data.rate,
      },
    }));

    console.log('Submitting data:', form.data);

    // http://127.0.0.1:9973/api/?
    form.post("/api/crud/ns.taxes", {
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

    if (!form.data.name.trim()) {
      form.setError('name', 'Role name is required');
      isValid = false;
    }

    if (!form.data.rate.trim()) {
      form.setError('rate', 'Rate is required');
      isValid = false;
    }

    if (!form.data.tax_group_id) {
      form.setError('tax_group_id', 'Tax group is required');
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'Create a new tax - JGREM'} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Create a new tax"
            description="Register a new tax and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField required label="First Name" error={form.errors.name} description="Provide a name to the resource." className="mb-6">
            <Input
              id="name"
              name="name"
              onChange={handleInputChange}
              className={cn(form.errors.name && 'border-destructive')}
              placeholder="Provide a name to the tax."
              required
            />
          </FormField>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Parent"
                description="Assign the tax to a tax group."
                htmlFor="tax_group_id"
                error={form.errors.tax_group_id}
                required
              >
                <Select
                  onValueChange={(value) => handleSelectChange("tax_group_id", +value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => {
                      return (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          <div className="flex items-center gap-2">
                            {group.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Rate" error={form.errors.name} required description="Define the rate value for the tax." className="mb-6">
                <Input
                  id="rate"
                  name="rate"
                  onChange={handleInputChange}
                  className={cn(form.errors.rate && 'border-destructive')}
                />
              </FormField>
              <FormField
                label="Description"
                htmlFor="description"
                description="Provide a description to the tax."
                error={form.errors?.description}
              >
                <Textarea
                  id="description"
                  name="description"
                  value={form.data.description}
                  onChange={handleInputChange}
                  placeholder="..."
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



