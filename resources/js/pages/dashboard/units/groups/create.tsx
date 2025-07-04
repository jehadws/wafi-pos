import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import FormField from "@/components/forms/shared/form-field";
import FormHeader from "@/components/forms/shared/form-header";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Unit Groups", href: "/dashboard/units/groups" },
  { title: "Create Unit Group", href: "/dashboard/units/groups/create" }
];

export default function Dashboard() {
  const form = useForm({
    name: '',
    description: '',
  });


  const handleInputChange = (name: keyof typeof form.data, value: string | number | number[]) => {
    form.setData({ ...form.data, [name]: value });

    // @ts-ignore
    if (form.errors[name]) form.clearErrors(name);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    validateStep();
    console.log('Submitting data:', form.data);
    form.post(route('ns.units.postGroup'), {
      showProgress: true,
      onError: (errors) => {
        console.error('Validation errors:', errors);
        if (errors.error) {
          alert(errors.error);
        }
      },
      onSuccess: (page) => {
        console.log('Property created successfully', page);
      }

    });
  };

  const validateStep = () => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.name.trim()) {
      form.setError('name', 'name is required');
      isValid = false;
    }
    return isValid;
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={"Create a new unit group - JGREM"} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Create a new unit group"
            description="Register a new unit group and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField
            label="Name"
            error={form.errors.name}
            description="Provide a name to the resource."
            className="mb-6"
          >
            <Input
              id="name"
              name="name"
              value={form.data.name || ''}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={cn(form.errors.name && 'border-destructive')}
              required
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Description"
              htmlFor="description"
              error={form.errors?.description}
            >
              <Textarea
                id="description"
                name="description"
                value={form.data.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </FormField>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}

