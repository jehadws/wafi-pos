import AppLayout from "@/layouts/app-layout";
import { Head, usePage } from "@inertiajs/react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { RadioGroup } from "@/components/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import FormHeader from "@/components/forms/shared/form-header";
import FormField from "@/components/forms/shared/form-field";
import { toast } from "sonner";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Units", href: "/dashboard/units" },
  { title: "Create Unit", href: "/dashboard/units/create" }
];

export default function Dashboard() {
  const { unitGroups } = usePage<{ unitGroups: { name: string, id: number }[] }>().props;
  const form = useForm({
    name: '',
    description: '',
    group_id: "",
    value: '',
    base_unit: 0,
    identifier: '',
    preview_url: '',
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
      name: form.data.name,
      general: {
        identifier: form.data.identifier,
        preview_url: form.data.preview_url,
        value: form.data.value,
        group_id: +form.data.group_id,
        base_unit: +form.data.base_unit,
        description: form.data.description
      }
    }

    form.transform(() => data)
    console.log('Submitting data:', data);

    form.post('/api/crud/ns.units', {
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
    if (!form.data.name.trim()) {
      form.setError('name', 'name is required');
      isValid = false;
    }
    if (!form.data.group_id) {
      form.setError('group_id', 'Group is required');
      isValid = false;
    }

    if (!form.data.value) {
      form.setError('value', 'Value is required');
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
            title="Create a new unit"
            description="Register a new unit and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField
            label="Name"
            error={form.errors.name}
            description="Provide a name to the resource."
            className="mb-6"
            required
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <FormField
              label="Identifier"
              error={form.errors.identifier}
              description="Provide a unique value for this unit. Might be composed from a name but shouldn't include space or special characters."
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
              label="Preview URL"
              error={form.errors.identifier}
              description="Preview of the unit."
            >
              <Input
                id="preview_url"
                name="preview_url"
                value={form.data.preview_url || ''}
                onChange={(e) => handleInputChange("preview_url", e.target.value)}
                className={cn(form.errors.preview_url && 'border-destructive')}
              />
            </FormField>

            <FormField
              label="Value"
              error={form.errors.value}
              description="Define the value of the unit."
              required
            >
              <Input
                id="value"
                name="value"
                value={form.data.value || ''}
                onChange={(e) => handleInputChange("value", e.target.value)}
                className={cn(form.errors.value && 'border-destructive')}
              />
            </FormField>

            <FormField
              label="Group"
              error={form.errors.group_id}
              description="Define to which group the unit should be assigned."
              required
            >
              <Select value={`${form.data.group_id}`} onValueChange={(value) => handleInputChange('group_id', +value)}>
                <SelectTrigger className={cn(form.errors.group_id && 'border-destructive')}>
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                  {unitGroups.map((group) => (
                    <SelectItem key={`${group.id}`} value={`${group.id}`}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Base Unit"
              error={form.errors.base_unit}
              description="Determine if the unit is the base unit from the group."
              required
            >
              <RadioGroup
                defaultValue={form.data.base_unit.toString()}
                value={form.data.base_unit === 1 ? "1" : "0"}
                onValueChange={(value) => handleInputChange('base_unit', +value)}
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
              label="Description"
              error={form.errors.description}
              description="Provide a short description about the unit."
            >
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your property in detail..."
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

