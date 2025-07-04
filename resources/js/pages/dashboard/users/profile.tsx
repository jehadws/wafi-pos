"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  EyeOff,
  User,
  Home,
  Key,
  Shield,
  FileText,
  Trash2,
  CreditCard,
  Lock,
  Upload,
  RefreshCw,
} from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { Head, router, useForm, usePage } from "@inertiajs/react"
import { toast } from "sonner"
import FormField from "@/components/forms/shared/form-field"
import axios from "axios"
import { TokenQrDialog } from "@/components/token-qr-dailog"
import ConfirmationDialog from "@/components/confirmation-dialog"


export default function EnhancedProfileSettings() {
  const { tokens, attributes, currentShipping, currentBilling } = usePage<{ tokens: ApiToken[] | undefined; attributes: UserAttribute, currentShipping: Address, currentBilling: Address }>().props;
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [openTokenModal, setOpenTokenModal] = useState(false)
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const form = useForm({
    attribute_theme: attributes.theme || "",
    attribute_avatar_link: attributes.avatar_link || "",
    attribute_language: attributes.language,
    shipping_first_name: currentShipping.first_name || "",
    shipping_last_name: currentShipping.last_name || "",
    shipping_phone: currentShipping.phone || "",
    shipping_address_1: currentShipping.address_1 || "",
    shipping_address_2: currentShipping.address_2 || "",
    shipping_country: currentShipping.country || "",
    shipping_city: currentShipping.city || "",
    shipping_pobox: currentShipping.pobox || "",
    shipping_company: currentShipping.company || "",
    shipping_email: currentShipping.email || "",
    billing_first_name: currentBilling.first_name || "",
    billing_last_name: currentBilling.last_name || "",
    billing_phone: currentBilling.phone || "",
    billing_address_1: currentBilling.address_1 || "",
    billing_address_2: currentBilling.address_2 || "",
    billing_country: currentBilling.country || "",
    billing_city: currentBilling.city || "",
    billing_pobox: currentBilling.pobox || "",
    billing_company: currentBilling.company || "",
    billing_email: currentBilling.email || "",
    security_old_password: "",
    security_password: "",
    security_password_confirm: "",
    token: {}
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

  const getTokens = async () => {
    router.reload({ only: ['tokens'] })
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    const security = form.data.security_password !== ""
      && form.data.security_old_password !== "" ? {
      old_password: form.data.security_old_password,
      password: form.data.security_password,
      password_confirm: form.data.security_password_confirm,
    } : {};

    form.transform(() => ({
      attribute: {
        theme: form.data.attribute_theme,
        avatar_link: form.data.attribute_avatar_link,
        language: form.data.attribute_language,
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
        email: form.data.shipping_email,
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
        email: form.data.billing_email,
      },
      security: security,
      token: {},
    }));

    form.post("/api/forms/ns.user-profile", {
      preserveScroll: true,
      onError: (errors) => {
        console.error('Validation errors:', errors);
        toast.error('Please fix the validation errors');
      },
      onSuccess: () => {
        toast.success('The user attribute has been saved.');
      },
    });
  };

  const confirmDeleteToken = (token: ApiToken) => {
    setTokenToDelete(token)
    setIsDeleteConfirmOpen(true)
  }

  const handleDeleteToken = () => {
    if (tokenToDelete) {

      axios.delete(`/api/users/tokens/${tokenToDelete.id}`)
        .then(() => {
          toast.success('Token deleted successfully');
          getTokens();
          setIsDeleteConfirmOpen(false)
          setTokenToDelete(null)
        })
        .catch(error => {
          if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
            toast.error('Please fix the validation errors');
          } else {
            console.error('Unexpected error:', error);
            toast.error('Something went wrong');
          }
        });
    }
  }

  const cancelDeleteToken = () => {
    setIsDeleteConfirmOpen(false)
    setTokenToDelete(null)
  }

  const generateToken = () => {
    axios.post('/api/users/create-token', { name: tokenName })
      .then(response => {
        const token = response.data.data.token.plainTextToken;
        console.log('Token:', token);

        setToken(token);
        setOpenTokenModal(true);
        toast.success('Token created successfully');
      })
      .catch(error => {
        if (error.response?.data?.errors) {
          console.error('Validation errors:', error.response.data.errors);
          toast.error('Please fix the validation errors');
        } else {
          console.error('Unexpected error:', error);
          toast.error('Something went wrong');
        }
      });
  }

  const validateForm = () => {
    let isValid = true;
    form.clearErrors();

    if (form.data.security_password !== form.data.security_password_confirm) {
      isValid = false;
      form.setError('security_password_confirm', 'The password confirmation does not match.');
    }


    return isValid;
  };

  return (

    <AppLayout breadcrumbs={[]}>
      <Head title={"Category Products"} />
      <form onSubmit={handleSubmit}>
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
          <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <User className="h-8 w-8 text-primary" />
                  My Profile
                </h1>
                <p className="mt-1 text-muted-foreground">Manage your personal account settings and preferences</p>
              </div>

              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <Button variant="outline" type="button" onClick={() => form.reset()} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
                <Button type="submit" className="gap-2">Save Changes</Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="rounded-xl overflow-hidden">
              {/* Tabs */}
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full h-12">
                  <TabsTrigger value="general">
                    <User className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    <Home className="h-4 w-4" />
                    Shipping
                  </TabsTrigger>
                  <TabsTrigger value="billing">
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="api" onClick={getTokens}>
                    <Key className="h-4 w-4" />
                    API Token
                  </TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="pt-4 space-y-8 focus:outline-none">
                  {/* Appearance */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Appearance
                      </CardTitle>
                      <CardDescription>Customize how your profile looks</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                      {/* Avatar */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Profile Picture</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-primary-200">
                            <AvatarImage src="/placeholder.svg?height=80&width=80" />
                            <AvatarFallback className="text-lg">JD</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <Button type="button" variant="outline" size="sm" className="gap-2 w-full">
                              <Upload className="h-4 w-4" />
                              Upload New
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Recommended: Square JPG, PNG, or GIF, at least 200x200 pixels
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Theme */}

                      <FormField
                        label="Theme"
                        description="Choose how the dashboard looks to you"
                        htmlFor="attribute_theme"
                        error={form.errors.attribute_theme}
                      >
                        <Select
                          value={form.data.attribute_theme}
                          onValueChange={(value) => handleSelectChange("attribute_theme", value)}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      {/* Language */}
                      <FormField
                        label="Language"
                        description="Choose your preferred language for the interface"
                        htmlFor="attribute_language"
                        error={form.errors.attribute_language}
                      >
                        <Select
                          value={form.data.attribute_language}
                          onValueChange={(value) => handleSelectChange("attribute_language", value)}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English (US)</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </CardContent>
                  </Card>

                </TabsContent>

                {/* Shipping Tab */}
                <TabsContent value="shipping" className="pt-4 space-y-6 focus:outline-none">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        Shipping Information
                      </CardTitle>
                      <CardDescription>Manage your shipping details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          description="Shipping contact number."
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
                      </div>

                      <Separator />

                      {/* Address Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <FormField
                          label="Address Line 1"
                          htmlFor="shipping_address_1"
                          description="Street address, P.O. box, company name"
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
                          label="Address Line 2"
                          htmlFor="shipping_address_1"
                          description="Apartment, suite, unit, building, floor, etc."
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <FormField
                          label="Country"
                          htmlFor="shipping_country"
                          description="Shipping country"
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
                          description="City or town"
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
                          description="Postal Address"
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
                      </div>

                      <FormField
                        label="Email"
                        htmlFor="shipping_email"
                        description="Shipping email address"
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
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="pt-4 space-y-6 focus:outline-none">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        Billing Information
                      </CardTitle>
                      <CardDescription>Manage your Billing details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          description="Billing contact number."
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
                      </div>

                      <Separator />

                      {/* Address Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <FormField
                          label="Address Line 1"
                          htmlFor="billing_address_1"
                          description="Street address, P.O. box, company name"
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
                          label="Address Line 2"
                          htmlFor="billing_address_1"
                          description="Apartment, suite, unit, building, floor, etc."
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <FormField
                          label="Country"
                          htmlFor="billing_country"
                          description="Billing country"
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
                          description="City or town"
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
                          description="Postal Address"
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
                      </div>

                      <FormField
                        label="Email"
                        htmlFor="billing_email"
                        description="Billing email address"
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
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="pt-4 space-y-6 focus:outline-none">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Password Management
                      </CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          label="Current Password"
                          htmlFor="security_old_password"
                          description="Enter your Current password"
                          error={form.errors?.security_old_password}
                        >
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-primary-400" />
                            <Input
                              id="security_old_password"
                              name="security_old_password"
                              value={form.data.security_old_password}
                              onChange={handleInputChange}
                              className={form.errors?.security_old_password ? "border-red-500 pl-10 pr-10" : "pl-10 pr-10"}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-primary-400 hover:text-primary-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormField>

                        <FormField
                          label="New Password"
                          htmlFor="security_password"
                          description="At least 8 characters with letters and numbers"
                          error={form.errors?.security_password}
                        >
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-primary-400" />
                            <Input
                              id="security_password"
                              name="security_password"
                              value={form.data.security_password}
                              onChange={handleInputChange}
                              className={form.errors?.security_password ? "border-red-500 pl-10 pr-10" : "pl-10 pr-10"}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-primary-400 hover:text-primary-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormField>

                        <FormField
                          label="Confirm New Password"
                          htmlFor="security_password_confirm"
                          description="Re-enter your new password"
                          error={form.errors?.security_password_confirm}
                        >
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-primary-400" />
                            <Input
                              id="security_password_confirm"
                              name="security_password_confirm"
                              value={form.data.security_password_confirm}
                              onChange={handleInputChange}
                              className={form.errors?.security_password_confirm ? "border-red-500 pl-10 pr-10" : "pl-10 pr-10"}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-primary-400 hover:text-primary-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormField>
                      </div>
                    </CardContent>
                  </Card>

                </TabsContent>

                {/* API Token Tab */}
                <TabsContent value="api" className="pt-4 space-y-6 focus:outline-none">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <div className="text-blue-600 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-blue-800 font-medium mb-1">About API Tokens</h3>
                        <p className="text-blue-700 text-sm">
                          API tokens provide secure access to resources without sharing your personal credentials. Tokens
                          remain active until explicitly revoked. Keep your tokens secure and never share them publicly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Create New Token
                      </CardTitle>
                      <CardDescription>Generate a new API token for your applications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <FormField
                          label="Token Name"
                          htmlFor="tokenName"
                          description="A descriptive name to identify this token"
                        >
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-primary-400" />
                            <Input
                              id="tokenName"
                              name="tokenName"
                              value={tokenName}
                              onChange={(e) => setTokenName(e.target.value)}
                              className={"pl-10 pr-10"}
                              placeholder="My API Token"
                            />
                          </div>
                        </FormField>
                      </div>

                      <div className="pt-2">
                        <Button type="button" onClick={generateToken}>Generate Token</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Active Tokens
                      </CardTitle>
                      <CardDescription>Manage your existing API tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {tokens === undefined || tokens?.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <p>You haven't generated any tokens yet.</p>
                          <p className="text-sm mt-1">Create your first token to get started.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tokens.map((token) => (
                            <div key={token.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Key className="h-5 w-5" />
                                  <div>
                                    <div className="font-medium">{token.name}</div>
                                    <div className="text-xs">
                                      Created {token.created_at}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-800 dark:text-green-400 dark:border-green-700">
                                    Active
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => confirmDeleteToken(token)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <TokenQrDialog
            isOpen={openTokenModal}
            onClose={() => setOpenTokenModal(false)}
            tokenName={tokenName}
            tokenValue={token}
          />
          <ConfirmationDialog
            isOpen={isDeleteConfirmOpen}
            onClose={cancelDeleteToken}
            onConfirm={handleDeleteToken}
            title="Revoke API Token"
            description={
              tokenToDelete
                ? `Are you sure you want to revoke the token "${tokenToDelete.name}"? This action cannot be undone and any applications using this token will lose access.`
                : "Are you sure you want to revoke this token?"
            }
            confirmText="Revoke Token"
            cancelText="Cancel"
            variant="destructive"
          />
        </div>
      </form>
    </AppLayout>
  )
}

