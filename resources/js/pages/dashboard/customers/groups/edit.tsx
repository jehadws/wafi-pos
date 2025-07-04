import React from 'react'
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@radix-ui/react-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Coupons', href: '/dashboard/customers/rewards' },
];

export default function CreateRewardSystemPage() {
  const { rewards, group } = usePage<{ rewards: Coupon[], group: CustomerGroup }>().props;

  console.log("group", group)

  const form = useForm({
    name: group.name,
    reward_system_id: group.reward_system_id,
    minimal_credit_payment: group.minimal_credit_payment,
    description: group.description,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;
    form.transform(() => ({
      name: form.data.name,
      general: {
        reward_system_id: form.data.reward_system_id,
        minimal_credit_payment: form.data.minimal_credit_payment,
        description: form.data.description,
      },
    }));

    console.log("form.data", form.data)

    form.put(`/api/crud/ns.customers-groups/${group.id}`, {
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

    if (!form.data.reward_system_id) {
      form.setError('reward_system_id', 'Coupon is required');
      isValid = false;
    }

    if (!form.data.minimal_credit_payment) {
      form.setError('minimal_credit_payment', 'Target is required');
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
            title="Edit Customers Group"
            description="Modify Customers Group."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Name"
              description="Provide a name to the resource."
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
              label="Reward System"
              description="Select which Reward system applies to the group"
              htmlFor="reward_system_id"
              error={form.errors.reward_system_id}
            >
              <Select
                value={form.data.reward_system_id?.toString()}
                onValueChange={(value) => handleSelectChange("reward_system_id", +value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rewards.map((reward) => {
                    return (
                      <SelectItem key={reward.id} value={reward.id.toString()}>
                        <div className="flex items-center gap-2">
                          {reward.name}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Minimum Credit Amount"
              description='Determine in percentage, what is the first minimum credit payment made by all customers on the group, in case of credit order. If left to "0", no minimal credit amount is required.'
              htmlFor="minimal_credit_payment"
              error={form.errors.minimal_credit_payment}
            >
              <Input
                placeholder="e.g., 200"
                id="minimal_credit_payment"
                name="minimal_credit_payment"
                value={form.data.minimal_credit_payment}
                onChange={handleInputChange}
                type='number'
                className={cn(form.errors.minimal_credit_payment && 'border-destructive', "uppercase")}
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
                placeholder="Describe the purpose of this customer group..."
                className={cn(form.errors.description && 'border-destructive', "min-h-[80px]")}
              />
            </FormField>

          </div>
        </div>
      </form>
    </AppLayout>
  );
}


