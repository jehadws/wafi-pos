import AppLayout from "@/layouts/app-layout";
import { Head, usePage } from "@inertiajs/react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { toast } from "sonner";
import FormHeader from "@/components/forms/shared/form-header";
import FormField from "@/components/forms/shared/form-field";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Category Products", href: "/dashboard/products/categories" },
  { title: "Edit Category Products", href: "/dashboard/products/categories/edit" }
];

export default function Dashboard() {
  const { category, categories } = usePage<{ category: CategoryProduct, categories: CategoryProduct[] }>().props;
  console.log("category", category)
  const form = useForm({
    name: category.name,
    description: category.description || "",
    parent_id: category.parent_id || 0,
    displays_on_pos: category.displays_on_pos,
    preview_url: category.preview_url || "",
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
        description: form.data.description,
        parent_id: form.data.parent_id,
        displays_on_pos: form.data.displays_on_pos,
        preview_url: form.data.preview_url,
      }
    }

    console.log('Submitting data:', data);
    form.transform(() => data);

    form.put(`/api/crud/ns.products-categories/${category.id}`, {
      showProgress: true,
      onError: (errors) => {
        console.error('Validation errors:', errors);
        if (errors.error) {
          alert(errors.error);
        }
      },
      onSuccess: () => {
        toast.info('Category created successfully')
      }
    });
  };

  const validateStep = () => {
    console.log("calling validtatio")
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
            title="Create a new category product"
            description="Register a new category product and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <FormField
            label="Name"
            error={form.errors.name}
            description="Provide a name to the resource."
            className="mb-4"
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            <FormField
              label="Preview"
              error={form.errors.preview_url}
              description="Provide a preview url to the category."
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
              label="Display On POS"
              error={form.errors.displays_on_pos}
              description="If clicked to no, all products assigned to this category or all sub categories, won't appear at the POS."
            >
              <RadioGroup
                id="displays_on_pos"
                defaultValue={form.data.displays_on_pos.toString()}
                value={form.data.displays_on_pos.toString()}
                onValueChange={(value) => handleInputChange('displays_on_pos', +value)}
                className="flex gap-4 h-10"
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
              label="Parent"
              error={form.errors.parent_id}
              description="If this category should be a child category of an existing category."
            >

              <Select value={form.data.parent_id.toString()} onValueChange={(value) => handleInputChange('parent_id', +value)}>
                <SelectTrigger className={cn(form.errors.parent_id && 'border-destructive')}>
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={`0`} value={"0"}>No Parent</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={`${category.id}-${category.name}`} value={`${category.id}`}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Description"
              error={form.errors.description}
              description="Provide a short description about the category."
            >
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your category in detail..."
                rows={5}
                value={form.data.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={cn(form.errors.description && 'border-destructive')}
              />
            </FormField>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}


