import React from 'react'
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@radix-ui/react-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Coupons', href: '/dashboard/customers/coupons' },
];

interface RewardRule {
  id: string
  from: number
  to: number
  reward: number
}

type FormData = {
  name: string
  coupon_id: number
  target: number
  description: string
  rules: RewardRule[]
}

export default function CreateRewardSystemPage() {
  const { coupons } = usePage<{ coupons: Coupon[] }>().props;

  const form = useForm<FormData>({
    name: "",
    coupon_id: undefined,
    target: undefined,
    description: undefined,
    rules: [],
  })

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

  const addRule = () => {
    const id = Date.now().toString();
    const newRule: RewardRule = {
      id: id,
      from: "",
      to: "",
      reward: "",
    }
    form.setData({ ...form.data, rules: [...form.data.rules, newRule] })
    // @ts-ignore
    if (form.errors[`rules.${id}.from`]) form.clearErrors(`rules.${id}.from`);
    // @ts-ignore
    if (form.errors[`rules.${id}.to`]) form.clearErrors(`rules.${id}.to`);
    // @ts-ignore
    if (form.errors[`rules.${id}.reward`]) form.clearErrors(`rules.${id}.reward`);
  }

  const removeRule = (id: string) => {
    form.setData({ ...form.data, rules: form.data.rules.filter((rule) => rule.id !== id) })

    // clear errors
    // @ts-ignore
    if (form.errors[`rules.${id}.from`]) form.clearErrors(`rules.${id}.from`);
    // @ts-ignore
    if (form.errors[`rules.${id}.to`]) form.clearErrors(`rules.${id}.to`);
    // @ts-ignore
    if (form.errors[`rules.${id}.reward`]) form.clearErrors(`rules.${id}.reward`);
  }

  const updateRule = (id: string, field: keyof RewardRule, value: string) => {
    form.setData({ ...form.data, rules: form.data.rules.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)) })

    // @ts-ignore
    if (form.errors[`rules.${id}.${field}`]) form.clearErrors(`rules.${id}.${field}`);
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;
    const rules = form.data.rules.map((rule) => ({
      from: +rule.from,
      to: +rule.to,
      reward: +rule.reward,
    }))

    form.transform(() => ({
      name: form.data.name,
      general: {
        coupon_id: form.data.coupon_id,
        target: form.data.target,
        description: form.data.description,
      },
      rules: rules,
    }));

    console.log("data", {
      name: form.data.name,
      general: {
        coupon_id: form.data.coupon_id,
        target: form.data.target,
        description: form.data.description,
      },
      rules: rules,
    })

    console.log("form.data", form.data)

    form.post("/api/crud/ns.rewards-system", {
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

    if (!form.data.name?.trim()) {
      form.setError('name', 'Name is required');
      isValid = false;
    }

    if (!form.data.coupon_id) {
      form.setError('coupon_id', 'Coupon is required');
      isValid = false;
    }

    if (!form.data.target) {
      form.setError('target', 'Target is required');
      isValid = false;
    }

    try {

      if (form.data.rules.length === 0) {
        form.setError('rules', 'At least one rule is required');
        toast.error('At least one rule is required');
        isValid = false;
      } else {
        form.data.rules.forEach((rule) => {
          if (!rule.from) {
            form.setError(`rules.${rule.id}.from`, 'From value is required.');
            isValid = false;
          }

          if (!rule.to) {
            form.setError(`rules.${rule.id}.to`, 'To value is required.');
            isValid = false;
          }

          if (!rule.reward) {
            form.setError(`rules.${rule.id}.reward`, 'Points value is required.');
            isValid = false;
          }
        });
      }
    } catch (e) {
      form.setError('rules', 'Invalid rules format');
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
            title="Create a new reward system"
            description="Register a new reward system and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <div className="space-y-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-6 col-span-1">
              <FormField
                label="Coupon Name"
                description="Provide a name for the coupon"
                error={form.errors.name}
              >
                <Input
                  id="name"
                  name="name"
                  onChange={handleInputChange}
                  className={cn(form.errors.name && 'border-destructive')}
                  value={form.data.name}
                  placeholder="e.g., Summer Sale 2024"
                />
              </FormField>
              <FormField
                label="Coupon"
                description="Decide which coupon you would apply to the system."
                htmlFor="coupon_id"
                error={form.errors.coupon_id}
              >
                <Select
                  onValueChange={(value) => handleSelectChange("coupon_id", +value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.map((coupon) => {
                      return (
                        <SelectItem key={coupon.id} value={coupon.id.toString()}>
                          <div className="flex items-center gap-2">
                            {coupon.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Target"
                description="This is the objective that the user should reach to trigger the reward."
                htmlFor="target"
                error={form.errors.target}
              >
                <Input
                  placeholder="e.g., 200"
                  id="target"
                  name="target"
                  value={form.data.target}
                  onChange={handleInputChange}
                  type='number'
                  className={cn(form.errors.target && 'border-destructive', "uppercase")}
                />
              </FormField>
              <FormField
                label="Description"
                description="Optional description for internal use"
                htmlFor="description"
                error={form.errors.description}
              >
                <Textarea
                  id="description"
                  name="description"
                  value={form.data.description}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of this coupon..."
                  className={cn(form.errors.description && 'border-destructive', "min-h-[80px]")}
                />
              </FormField>

              <Button type="button" onClick={addRule} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.data.rules.map((rule) => (
                  <Card key={rule.id} className="relative">
                    <CardContent className="p-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeRule(rule.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>


                      <div className="flex flex-col gap-4">
                        <FormField
                          label="From"
                          description="The interval start here."
                          error={form.errors[`rules.${rule.id}.from`]}
                        >
                          <Input
                            id="from"
                            name="from"
                            className={cn(form.errors[`rules.${rule.id}.from`] && 'border-destructive')}
                            type='number'
                            placeholder="e.g., 200"
                            value={rule.from}
                            onChange={(e) => updateRule(rule.id, "from", e.target.value)}
                          />
                        </FormField>

                        <FormField
                          label="To"
                          description="The interval ends here."
                          error={form.errors[`rules.${rule.id}.to`]}
                        >
                          <Input
                            id="to"
                            name="to"
                            className={cn(form.errors[`rules.${rule.id}.to`] && 'border-destructive')}
                            type='number'
                            placeholder="e.g., 400"
                            value={rule.to}
                            onChange={(e) => updateRule(rule.id, "to", e.target.value)}
                          />
                        </FormField>
                        <FormField
                          label="Points"
                          description="Points earned."
                          error={form.errors[`rules.${rule.id}.reward`]}
                        >
                          <Input
                            id="reward"
                            name="reward"
                            className={cn(form.errors[`rules.${rule.id}.reward`] && 'border-destructive')}
                            placeholder="e.g., 200"
                            value={rule.reward}
                            type='number'
                            onChange={(e) => updateRule(rule.id, "reward", e.target.value)}
                          />
                        </FormField>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}

