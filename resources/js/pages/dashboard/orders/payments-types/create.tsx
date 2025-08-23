import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { RadioGroup } from "@/components/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import FormHeader from "@/components/forms/shared/form-header";
import FormField from "@/components/forms/shared/form-field";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Payment Types", href: "/dashboard/orders/payments-types" },
  { title: "Create a new payment type", href: "/dashboard/orders/payments-types/create" }
];

export default function Dashboard() {
  const form = useForm({
    label: '',
    active: 0,
    priority: "",
    identifier: '',
    description: "",
  });

  const handleInputChange = (name: keyof typeof form.data, value: string | number | number[]) => {
    form.setData({ ...form.data, [name]: value });

    // @ts-ignore
    if (form.errors[name]) form.clearErrors(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    const data = {
      label: form.data.label,
      general: {
        identifier: form.data.identifier,
        description: form.data.description,
        priority: +form.data.priority,
        active: +form.data.active,
      }
    }

    form.transform(() => data)
    console.log('Submitting data:', data);

    form.post('/api/crud/ns.payments-types', {
      showProgress: true,
      onError: (errors) => {
        console.error('Validation errors:', errors);
        if (errors.error) {
          alert(errors.error);
        }
      },
      onSuccess: () => {
        toast.info('Unit created successfully');
      }
    });
  };


  const validateStep = () => {
    let isValid = true;
    form.clearErrors();
    if (!form.data.label.trim()) {
      form.setError('label', 'label is required');
      isValid = false;
    }

    return isValid;
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={"Create a new payment type"} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Create a new payment type"
            description="Register a new payment type and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField
            label="Label"
            error={form.errors.label}
            description="Provide a label to the resource."
            required
          >
            <Input
              id="label"
              name="label"
              value={form.data.label || ''}
              onChange={(e) => handleInputChange("label", e.target.value)}
              className={cn(form.errors.label && 'border-destructive')}
              required
            />
          </FormField>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Active"
              error={form.errors.active}
              required
            >
              <RadioGroup
                defaultValue={form.data.active.toString()}
                value={form.data.active === 1 ? "1" : "0"}
                onValueChange={(value) => handleInputChange('active', +value)}
                className="flex gap-6 py-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={`1`} id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={`0`} id="no" />
                  <Label htmlFor="no" className="cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </FormField>

            <FormField
              label="Priority"
              error={form.errors.priority}
              description={`Define the order for the payment. The lower the number is, the first it will display on the payment popup. Must start from "0".`}
              required
            >
              <Input
                id="priority"
                name="priority"
                type="number"
                value={form.data.priority || ''}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className={cn(form.errors.priority && 'border-destructive')}
              />
            </FormField>

            <FormField
              label="Identifier"
              error={form.errors.identifier}
            >
              <Input
                id="identifier"
                name="identifier"
                value={form.data.identifier || ''}
                onChange={(e) => handleInputChange("identifier", e.target.value)}
                className={cn(form.errors.identifier && 'border-destructive')}
              />
            </FormField>

            <FormField
              label="Description"
              error={form.errors.description}
            >
              <Textarea
                id="description"
                name="description"
                rows={5}
                value={form.data.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={cn(form.errors.description && 'border-destructive')}
              />
            </FormField>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}

