import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';

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
  const form = useForm({
    name: "",
    namespace: "",
    description: "",
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
      name: form.data.name,
      general: {
        namespace: form.data.namespace,
        description: form.data.description,
      },
    }));

    // http://127.0.0.1:9973/api/?
    form.post("/api/crud/ns.roles", {
      preserveScroll: true,
      onError: (errors) => {
        console.error('Validation errors:', errors);
        toast.error('Please fix the validation errors');
      },
      onSuccess: () => {
        toast.success('Role created successfully');
        // router.visit(route('ns.dashboard.users.roles'));
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
      <Head title={'Create a new unit group - JGREM'} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Create a new role"
            description="Create a new role and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField label="Name" error={form.errors.name} description="Provide a name to the resource." className="mb-6">
            <Input
              id="name"
              name="name"
              onChange={handleInputChange}
              className={cn(form.errors.name && 'border-destructive')}
              placeholder="Enter Role name"
              required
            />
          </FormField>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Namespace"
                htmlFor="namespace"
                description="Should be a unique value with no spaces or special character."
                error={form.errors?.namespace}
              >
                <Input
                  id="namespace"
                  name="namespace"
                  value={form.data.namespace}
                  onChange={handleInputChange}
                  placeholder="Enter namespace"
                  className={form.errors?.namespace ? "border-red-500" : ""}
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
                  value={form.data.description}
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

