import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Procurement Products", href: "/dashboard/procurements/products" },
  { title: "Edit Procurement Products", href: "/dashboard/procurements/products/edit" }
];

export default function CreateProductPage() {
  const { product } = usePage<{ product: ProcurementProduct }>().props;
  const form = useForm({
    name: product.name,
    expiration_date: product.expiration_date,
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
        expiration_date: form.data.expiration_date,
      },
    }));

    console.log('Submitting data:', form.data);

    // http://127.0.0.1:9973/api/?
    form.put(`/api/crud/ns.procurements-products/${product.id}`, {
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

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'Edit procurement product - JGREM'} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Edit procurement product"
            description="Modify Procurement Product and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField required label="Name" error={form.errors.name} description="Provide a name to the resource." className="mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Expiration Date"
                description="Define when that specific product should expire."
              >
                <DatePicker
                  onDateChange={(value) => handleSelectChange('expiration_date', value)}
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





