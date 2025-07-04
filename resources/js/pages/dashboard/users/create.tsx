import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import ToggleButtons from '@/components/forms/shared/toggle-buttons';
import { MultiSelector } from '@/components/ui/multi-selector';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Groups', href: '/dashboard/units/groups' },
];

export default function CreateProductPage() {
  const { groups, roles } = usePage<{ groups: { id: number, name: string }[], roles: { id: number, name: string }[] }>().props;
  const form = useForm({
    username: "",
    general_active: 0,
    general_birth_date: "",
    general_credit_limit_amount: "",
    general_email: "",
    general_first_name: "",
    general_gender: "",
    general_group_id: "",
    general_last_name: "",
    general_phone: "",
    general_pobox: "",
    general_roles: [],
    general_password: "",
    general_password_confirm: "",
    billing_first_name: "",
    billing_last_name: "",
    billing_phone: "",
    billing_address_1: "",
    billing_address_2: "",
    billing_country: "",
    billing_city: "",
    billing_pobox: "",
    billing_company: "",
    billing_email: "",
    shipping_first_name: "",
    shipping_last_name: "",
    shipping_phone: "",
    shipping_address_1: "",
    shipping_address_2: "",
    shipping_country: "",
    shipping_city: "",
    shipping_pobox: "",
    shipping_company: "",
    shipping_email: ""

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

    if (!validateForm()) {
      return;
    }

    form.transform(() => ({
      username: form.data.username,
      general: {
        first_name: form.data.general_first_name,
        last_name: form.data.general_last_name,
        credit_limit_amount: form.data.general_credit_limit_amount,
        group_id: form.data.general_group_id,
        birth_date: form.data.general_birth_date,
        email: form.data.general_email,
        phone: form.data.general_phone,
        pobox: form.data.general_pobox,
        gender: form.data.general_gender,
        active: form.data.general_active,
        roles: form.data.general_roles,
        password: form.data.general_password,
        password_confirm: form.data.general_password_confirm
      },
      billing: {
        first_name: form.data.billing_first_name,
        last_name: form.data.billing_last_name,
        phone: form.data.billing_phone,
        address_1: form.data.billing_address_1,
        address_2: form.data.billing_address_2,
        country: form.data.billing_country,
        city: form.data.billing_city,
        pobox: form.data.billing_pobox,
        company: form.data.billing_company,
        email: form.data.billing_email
      },
      shipping: {
        first_name: form.data.shipping_first_name,
        last_name: form.data.shipping_last_name,
        phone: form.data.shipping_phone,
        address_1: form.data.shipping_address_1,
        address_2: form.data.shipping_address_2,
        country: form.data.shipping_country,
        city: form.data.shipping_city,
        pobox: form.data.shipping_pobox,
        company: form.data.shipping_company,
        email: form.data.shipping_email
      }
    }));

    console.log('Form data:', form.data);

    form.post('/api/crud/ns.users', {
      preserveScroll: true,
      onError: (errors) => {
        form.clearErrors();
        for (const key in errors) {
          const flatKey = key.replace(/\./g, '_') as keyof typeof form.data;
          if (flatKey in form.data) {
            form.setError(flatKey, errors[key]);
          }
        }
        toast.error('Please fix the validation errors');
        console.error('Validation errors:', errors);
      },
      onSuccess: () => {
        toast.success('Product created successfully');
      },
    });
  };

  const validateForm = () => {
    console.log("calling validtatio")
    let isValid = true;
    form.clearErrors();

    if (!form.data.username.trim()) {
      form.setError('username', 'First name is required');
      isValid = false;
    }

    if (!form.data.general_group_id) {
      form.setError('general_group_id', 'Group is required');
      isValid = false;
    }

    if (!form.data.general_email) {
      form.setError('general_email', 'Email is required');
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'Create a new user - JGREM'} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="Create a new user"
            description="Register a new user and save it."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          {/* Product Name */}
          <FormField label="Username" error={form.errors.username} description="Provide a name to the resource." className="mb-2">
            <Input
              id="username"
              name="username"
              onChange={handleInputChange}
              className={cn(form.errors.username && 'border-destructive')}
            />
          </FormField>

          {/* Tabs */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="general">
                General
              </TabsTrigger>

              <TabsTrigger value="billing_address">
                Billing Address
              </TabsTrigger>

              <TabsTrigger value="shipping_address">
                Shipping Address
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <FormField
                  label="First Name"
                  htmlFor="general_first_name"
                  description="Provide the customer first name"
                  error={form.errors?.general_first_name}
                >
                  <Input
                    id="general_first_name"
                    name="general_first_name"
                    value={form.data.general_first_name}
                    onChange={handleInputChange}
                    className={form.errors?.general_first_name ? "border-red-500" : ""}
                  />
                </FormField>
                <FormField
                  label="Last Name"
                  htmlFor="general_last_name"
                  description="Provide the customer last name"
                  error={form.errors?.general_last_name}
                >
                  <Input
                    id="general_last_name"
                    name="general_last_name"
                    value={form.data.general_last_name}
                    onChange={handleInputChange}
                    className={form.errors?.general_last_name ? "border-red-500" : ""}
                  />
                </FormField>
                <FormField
                  label="Email"
                  htmlFor="general_email"
                  description="Provide the customer email."
                  error={form.errors?.general_email}
                  required
                >
                  <Input
                    id="general_email"
                    name="general_email"
                    value={form.data.general_email}
                    onChange={handleInputChange}
                    className={form.errors?.general_email ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Password"
                  htmlFor="general_password"
                  description="Make a unique and secure password."
                  error={form.errors?.general_password}
                >
                  <Input
                    id="general_password"
                    name="general_password"
                    value={form.data.general_password}
                    onChange={handleInputChange}
                    className={form.errors?.general_password ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Confirm Password"
                  htmlFor="general_password_confirm"
                  description="Should be the same as the password."
                  error={form.errors?.general_password_confirm}
                >
                  <Input
                    id="general_password_confirm"
                    name="general_password_confirm"
                    value={form.data.general_password_confirm}
                    onChange={handleInputChange}
                    className={form.errors?.general_password_confirm ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Active"
                  htmlFor="general_active"
                  description="Define whether the user can use the application."
                  error={form.errors.general_active}
                >
                  <ToggleButtons
                    value={form.data.general_active === 1}
                    onChange={(value) => handleSelectChange("general_active", value ? 1 : 0)}
                  />
                </FormField>

                <FormField
                  label="Credit Limit"
                  htmlFor="general_credit_limit_amount"
                  description="Set what should be the limit of the purchase on credit."
                  error={form.errors?.general_credit_limit_amount}
                >
                  <Input
                    id="general_credit_limit_amount"
                    name="general_credit_limit_amount"
                    value={form.data.general_credit_limit_amount}
                    onChange={handleInputChange}
                    type='number'
                    className={form.errors?.general_credit_limit_amount ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Roles"
                  description="Define what roles applies to the user"
                >
                  <MultiSelector
                    options={roles}
                    value={form.data.general_roles}
                    onChange={(value) => handleSelectChange("general_roles", value)}
                    placeholder="Select roles..."
                    searchPlaceholder="Search roles..."
                    emptyText="No Roles found"
                  />
                </FormField>

                <FormField
                  label="Group"
                  htmlFor="general_group_id"
                  description="Assign the customer to a group."
                  error={form.errors.general_group_id}
                  required
                >
                  <Select
                    value={form.data.general_group_id.toString()}
                    onValueChange={(value) => handleSelectChange("general_group_id", value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Birth Date"
                  htmlFor="general_birth_date"
                  description="Displays the customer birth date."
                  error={form.errors?.general_birth_date}
                >
                  <DatePicker
                    onDateChange={(value) => handleSelectChange("general_birth_date", value)}
                    date={form.data.general_birth_date}
                  />
                </FormField>



                <FormField
                  label="Phone"
                  htmlFor="general_phone"
                  description="Provide the customer phone number"
                  error={form.errors?.general_phone}
                >
                  <Input
                    id="general_phone"
                    name="general_phone"
                    value={form.data.general_phone}
                    onChange={handleInputChange}
                    type='tel'
                    className={form.errors?.general_phone ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="PO Box"
                  htmlFor="general_pobox"
                  description="Provide the customer PO.Box"
                  error={form.errors?.general_pobox}
                >
                  <Input
                    id="general_pobox"
                    name="general_pobox"
                    value={form.data.general_pobox}
                    onChange={handleInputChange}
                    className={form.errors?.general_pobox ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Gender"
                  htmlFor="general_gender"
                  description="Provide the customer gender."
                  error={form.errors?.general_gender}
                >
                  <Select
                    value={form.data.general_gender}
                    onValueChange={(value) => handleSelectChange("general_gender", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </TabsContent>
            <TabsContent value="billing_address" className='mt-6'>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="First Name"
                  htmlFor="billing_first_name"
                  description="Provide the billing first name."
                  error={form.errors?.billing_first_name}
                >
                  <Input
                    id="billing_first_name"
                    name="billing_first_name"
                    value={form.data.billing_first_name}
                    onChange={handleInputChange}
                    className={form.errors?.billing_first_name ? "border-red-500" : ""}
                  />
                </FormField>
                <FormField
                  label="Last Name"
                  htmlFor="billing_last_name"
                  description="Provide the billing last name."
                  error={form.errors?.billing_last_name}
                >
                  <Input
                    id="billing_last_name"
                    name="billing_last_name"
                    value={form.data.billing_last_name}
                    onChange={handleInputChange}
                    className={form.errors?.billing_last_name ? "border-red-500" : ""}
                  />
                </FormField>
                <FormField
                  label="Phone"
                  htmlFor="billing_phone"
                  description="Provide the Billing phone number."
                  error={form.errors?.billing_phone}
                >
                  <Input
                    id="billing_phone"
                    name="billing_phone"
                    value={form.data.billing_phone}
                    onChange={handleInputChange}
                    className={form.errors?.billing_phone ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Address 1"
                  htmlFor="billing_address_1"
                  description="Provide the Billing First Address."
                  error={form.errors?.billing_address_1}
                >
                  <Input
                    id="billing_address_1"
                    name="billing_address_1"
                    value={form.data.billing_address_1}
                    onChange={handleInputChange}
                    className={form.errors?.billing_address_1 ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Address 2"
                  htmlFor="billing_address_2"
                  description="Provide the Billing Second Address."
                  error={form.errors?.billing_address_2}
                >
                  <Input
                    id="billing_address_2"
                    name="billing_address_2"
                    value={form.data.billing_address_2}
                    onChange={handleInputChange}
                    className={form.errors?.billing_address_2 ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Country"
                  htmlFor="billing_country"
                  description="Provide Billing Country."
                  error={form.errors?.billing_country}
                >
                  <Input
                    id="billing_country"
                    name="billing_country"
                    value={form.data.billing_country}
                    onChange={handleInputChange}
                    className={form.errors?.billing_country ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="City"
                  htmlFor="billing_city"
                  description="Provide Billing city."
                  error={form.errors?.billing_city}
                >
                  <Input
                    id="billing_city"
                    name="billing_city"
                    value={form.data.billing_city}
                    onChange={handleInputChange}
                    className={form.errors?.billing_city ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="PO Box"
                  htmlFor="billing_pobox"
                  description="Provide Postal code."
                  error={form.errors?.billing_pobox}
                >
                  <Input
                    id="billing_pobox"
                    name="billing_pobox"
                    value={form.data.billing_pobox}
                    onChange={handleInputChange}
                    className={form.errors?.billing_pobox ? "border-red-500" : ""}
                  />
                </FormField>


                <FormField
                  label="Company"
                  htmlFor="billing_company"
                  description="Company name."
                  error={form.errors?.billing_company}
                >
                  <Input
                    id="billing_company"
                    name="billing_company"
                    value={form.data.billing_company}
                    onChange={handleInputChange}
                    className={form.errors?.billing_company ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Email"
                  htmlFor="billing_email"
                  description="Provide the billing email."
                  error={form.errors?.billing_email}
                >
                  <Input
                    id="billing_email"
                    name="billing_email"
                    value={form.data.billing_email}
                    onChange={handleInputChange}
                    className={form.errors?.billing_email ? "border-red-500" : ""}
                  />
                </FormField>

              </div>
            </TabsContent>


            <TabsContent value="shipping_address" className='mt-6'>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="First Name"
                  htmlFor="shipping_first_name"
                  description="Provide the shipping first name."
                  error={form.errors?.shipping_first_name}
                >
                  <Input
                    id="shipping_first_name"
                    name="shipping_first_name"
                    value={form.data.shipping_first_name}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_first_name ? "border-red-500" : ""}
                  />
                </FormField>
                <FormField
                  label="Last Name"
                  htmlFor="shipping_last_name"
                  description="Provide the shipping last name."
                  error={form.errors?.shipping_last_name}
                >
                  <Input
                    id="shipping_last_name"
                    name="shipping_last_name"
                    value={form.data.shipping_last_name}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_last_name ? "border-red-500" : ""}
                  />
                </FormField>
                <FormField
                  label="Phone"
                  htmlFor="shipping_phone"
                  description="Provide the shipping phone number."
                  error={form.errors?.shipping_phone}
                >
                  <Input
                    id="shipping_phone"
                    name="shipping_phone"
                    value={form.data.shipping_phone}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_phone ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Address 1"
                  htmlFor="shipping_address_1"
                  description="Provide the shipping First Address."
                  error={form.errors?.shipping_address_1}
                >
                  <Input
                    id="shipping_address_1"
                    name="shipping_address_1"
                    value={form.data.shipping_address_1}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_address_1 ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Address 2"
                  htmlFor="shipping_address_2"
                  description="Provide the shipping Second Address."
                  error={form.errors?.shipping_address_2}
                >
                  <Input
                    id="shipping_address_2"
                    name="shipping_address_2"
                    value={form.data.shipping_address_2}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_address_2 ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Country"
                  htmlFor="shipping_country"
                  description="Provide shipping Country."
                  error={form.errors?.shipping_country}
                >
                  <Input
                    id="shipping_country"
                    name="shipping_country"
                    value={form.data.shipping_country}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_country ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="City"
                  htmlFor="shipping_city"
                  description="Provide shipping city."
                  error={form.errors?.shipping_city}
                >
                  <Input
                    id="shipping_city"
                    name="shipping_city"
                    value={form.data.shipping_city}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_city ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="PO Box"
                  htmlFor="shipping_pobox"
                  description="Provide Postal code."
                  error={form.errors?.shipping_pobox}
                >
                  <Input
                    id="shipping_pobox"
                    name="shipping_pobox"
                    value={form.data.shipping_pobox}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_pobox ? "border-red-500" : ""}
                  />
                </FormField>


                <FormField
                  label="Company"
                  htmlFor="shipping_company"
                  description="Company name."
                  error={form.errors?.shipping_company}
                >
                  <Input
                    id="shipping_company"
                    name="shipping_company"
                    value={form.data.shipping_company}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_company ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Email"
                  htmlFor="shipping_email"
                  description="Provide the shipping email."
                  error={form.errors?.shipping_email}
                >
                  <Input
                    id="shipping_email"
                    name="shipping_email"
                    value={form.data.shipping_email}
                    onChange={handleInputChange}
                    className={form.errors?.shipping_email ? "border-red-500" : ""}
                  />
                </FormField>

              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </AppLayout>
  );
}


