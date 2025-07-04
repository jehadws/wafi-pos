import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

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
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Calculator, Package, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: "Procurements", href: "/dashboard/procurements" },
  { title: "Create Procurement", href: "/dashboard/procurements/create" }
];

const DeliveryStatus = [
  { value: "delivered", label: "Delivered" },
  { value: "pending", label: "Pending" },
];

const PaymentStatus = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
] as const;


type FormValues = {
  name: string
  general_automatic_approval: number
  general_delivery_status: string
  general_delivery_time: string
  general_invoice_date: string
  general_invoice_reference: string
  general_payment_status: string
  general_provider_id: string
  products: ProductAdd[]
}

export default function CreateProductPage() {
  const { providers, tax_groups } = usePage<{ providers: { id: number, name: string }[]; tax_groups: { id: number, name: string }[] }>().props;
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const [activeModal, setActiveModal] = useState<{
    type: "options" | "unit" | "tax" | "convert" | null
    product_id: number | null
    group_id: number | null
  }>({ type: null, product_id: null, group_id: null })


  const form = useForm<FormValues>({
    name: "",
    general_automatic_approval: 1,
    general_delivery_status: "delivered",
    general_delivery_time: "2025-06-14",
    general_invoice_date: "2025-06-14",
    general_invoice_reference: "",
    general_payment_status: "paid",
    general_provider_id: "",
    products: [],
  });

  const handleInputChange = (name: keyof typeof form.data, value: string | number | number[]) => {
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

    console.log("Form data", form.data)

    const data = {
      name: form.data.name,
      general: {
        invoice_reference: form.data.general_invoice_reference || null,
        delivery_time: format(form.data.general_delivery_time, 'yyyy-MM-dd'),
        invoice_date: format(form.data.general_invoice_date, 'yyyy-MM-dd'),
        automatic_approval: form.data.general_automatic_approval,
        delivery_status: form.data.general_delivery_status,
        payment_status: form.data.general_payment_status,
        provider_id: form.data.general_provider_id,
      },
      products: form.data.products.map((product) => ({
        gross_purchase_price: !Number.isNaN(product.gross_purchase_price) ? product.gross_purchase_price : 0,
        purchase_price_edit: !Number.isNaN(product.purchase_price_edit) ? product.purchase_price_edit : 0,
        tax_value: !Number.isNaN(product.tax_value) ? product.tax_value : 0,
        net_purchase_price: !Number.isNaN(product.net_purchase_price) ? product.net_purchase_price : 0,
        purchase_price: !Number.isNaN(product.purchase_price) ? product.purchase_price : 0,
        total_price: !Number.isNaN(product.total_price) ? product.total_price : 0,
        total_purchase_price: !Number.isNaN(product.total_purchase_price) ? product.total_purchase_price : 0,
        quantity: !Number.isNaN(product.quantity) ? product.quantity.toString() : "0",
        expiration_date: product.expiration_date ? format(product.expiration_date, 'yyyy-MM-dd HH:mm:ss') : null,
        tax_group_id: product.tax_group_id ? product.tax_group_id : null,
        tax_type: product.tax_type ? product.tax_type : "inclusive",
        unit_id: product.unit_id,
        product_id: product.product_id,
        convert_unit_id: product.convert_unit_id ? product.convert_unit_id : null,
        procurement_id: product.procurement_id,
        $invalid: false,
        // convert_unit_label: product.convert_unit_label ? product.convert_unit_label : null
      }))
    }

    console.log('Form data transformed:', data);

    form.transform(() => data);

    form.post('/api/procurements', {
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

    // if (!form.data.name.trim()) {
    //   form.setError('name', 'name is required');
    //   isValid = false;
    // }
    //
    // if (!form.data.general_provider_id) {
    //   form.setError('general_provider_id', 'Provider is required');
    //   isValid = false;
    // }

    return isValid;
  };

  const addProduct = (product: ProductSearchResult) => {
    const newProduct: ProductAdd = {
      product_id: product.id,
      expiration_date: null,
      gross_purchase_price: 0,
      purchase_price_edit: 0,
      net_purchase_price: null,
      purchase_price: 0,
      total_price: 0,
      total_purchase_price: 0,
      quantity: 0,
      unit_id: product.unit_quantities.length > 0 ? product.unit_quantities[0].unit_id : null,
      convert_unit_id: null,
      procurement_id: null,
      $invalid: false,
      convert_unit_label: null,
      ...product
    }

    form.setData('products', [...form.data.products, newProduct])

    setSearchQuery("")
    setSearchResults([])
  }

  const removeProduct = (id: number) => {
    form.setData('products', form.data.products.filter((p) => p.product_id !== id))
  }

  const updateProduct = (id: number, field: keyof ProductAdd, value: string | number) => {
    console.log(id, field, value)
    form.setData('products',
      form.data.products.map((p) => {
        if (p.product_id === id) {
          const updated = { ...p, [field]: value }
          if (field === "purchase_price" || field === "quantity") {
            updated.total_purchase_price = updated.purchase_price * updated.quantity
            updated.purchase_price_edit = updated.purchase_price
            updated.gross_purchase_price = updated.purchase_price
            updated.net_purchase_price = updated.purchase_price
          }
          return updated
        }
        return p
      }),
    )
  }

  const searchProduct = async (search: string) => {
    setSearchQuery(search)
    try {
      const response = await axios.post('/api/procurements/products/search-product', {
        search
      })

      if (response.data) {
        setSearchResults(response.data)
        console.log('Search results:', response.data);
      }
    } catch (error) {
      console.error('Error searching selectedProducts:', error);
    }
  }

  const getConvertUnits = async (group_id: number, product_id: number) => {
    try {
      const response = await axios.get(`/api/units-groups/${group_id}/units`)

      if (response.data) {
        // remove the units that are in product.unit_quantities
        const data = response.data.filter((unit: Unit) => !form.data.products.find((p) => p.unit_quantities.find((uq) => uq.unit_id === unit.id)))
        setUnits(data)
        console.log('Convert units', response.data);
      }
    } catch (error) {
      console.error('Error get convert units:', error);
    }

  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={'New Procurement - JGREM'} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title="New Procurement"
            description="Make a new procurement."
            onCancel={() => window.history.back()}
            onSave={() => { }}
            form={form}
          />

          {/* Product Name */}

          <FormField
            label="Procurement Name"
            error={form.errors.name}
            description="Provide a name that will help to identify the procurement."
            className="mb-6"
          >
            <Input
              id="name"
              name="name"
              value={form.data.name || ''}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={cn(form.errors.name && 'border-destructive')}
              placeholder="Enter product name"
              required
            />
          </FormField>

          {/* Tabs */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="general">
                General
              </TabsTrigger>

              <TabsTrigger value="products">
                Products
              </TabsTrigger>

            </TabsList>

            <TabsContent value="general" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <FormField
                  label="Invoice Number"
                  htmlFor="general_invoice_reference"
                  description="If the procurement has been issued outside of JGREMOS, please provide a unique reference."
                  error={form.errors?.general_invoice_reference}
                >
                  <Input
                    id="general_invoice_reference"
                    name="general_invoice_reference"
                    value={form.data.general_invoice_reference}
                    onChange={(e) => handleInputChange("general_invoice_reference", e.target.value)}
                    className={form.errors?.general_invoice_reference ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Delivery Time"
                  htmlFor="general_delivery_time"
                  description="If the procurement has to be delivered at a specific time, define the moment here."
                  error={form.errors?.general_delivery_time}
                >
                  <DatePicker
                    onDateChange={(value) => handleInputChange("general_delivery_time", value)}
                    date={form.data.general_delivery_time}
                  />
                </FormField>

                <FormField
                  label="Invoice Date"
                  htmlFor="general_invoice_date"
                  description="If you would like to define a custom invoice date."
                  error={form.errors?.general_invoice_date}
                >
                  <DatePicker
                    onDateChange={(value) => handleInputChange("general_invoice_date", value)}
                    date={form.data.general_invoice_date}
                  />
                </FormField>


                <FormField
                  label="Automatic Approval"
                  htmlFor="general_automatic_approval"
                  description="Determine if the procurement should be marked automatically as approved once the Delivery Time occurs."
                  error={form.errors.general_automatic_approval}
                >
                  <ToggleButtons
                    value={form.data.general_automatic_approval === 1}
                    onChange={(value) => handleInputChange("general_automatic_approval", value ? 1 : 0)}
                  />
                </FormField>


                <FormField
                  label="Delivery Status"
                  htmlFor="general_delivery_status"
                  description={`Determine what is the actual value of the procurement. Once "Delivered" the status can't be changed, and the stock will be updated.`}
                  error={form.errors?.general_delivery_status}
                >
                  <Select
                    value={form.data.general_delivery_status}
                    onValueChange={(value) => handleInputChange("general_delivery_status", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {DeliveryStatus.map((status) => (
                        <SelectItem key={status.value} value={status.value} >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Payment Status"
                  htmlFor="general_payment_status"
                  description={`Determine what is the actual payment status of the procurement.`}
                  error={form.errors?.general_payment_status}
                >
                  <Select
                    value={form.data.general_payment_status}
                    onValueChange={(value) => handleInputChange("general_payment_status", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {PaymentStatus.map((status) => (
                        <SelectItem key={status.value} value={status.value} >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Provider"
                  htmlFor="general_provider_id"
                  description={'Determine what is the actual provider of the current procurement.'}
                  error={form.errors?.general_provider_id}
                >
                  <Select
                    value={form.data.general_provider_id.toString()}
                    onValueChange={(value) => handleInputChange("general_provider_id", +value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

              </div>
            </TabsContent>
            <TabsContent value="products" className='mt-6'>

              <div className="space-y-4">
                {/* Search Bar */}
                <div>
                  <Input
                    placeholder="SKU, Barcode, Name"
                    value={searchQuery}
                    onChange={(e) => searchProduct(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="rounded-lg overflow-hidden border">
                  {searchResults.length > 0 && searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="grid p-4 border-b font-medium text-sm cursor-pointer hover:bg-accent last:border-b-0"
                      onClick={() => addProduct(product)}
                    >
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</div>
                      <div className="text-sm text-muted-foreground">Barcode: {product.barcode}</div>
                    </div>

                  ))}
                </div>

                {/* Products Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-4 border-b font-medium text-sm">
                    <div>Name</div>
                    <div>Unit Price</div>
                    <div>Tax Value</div>
                    <div>Quantity</div>
                    <div>Total Price</div>
                  </div>

                  {form.data.products.map((product, index) => (
                    <div key={product.product_id} className="flex  p-4 flex-col border-b last:border-b-0">
                      <div className="grid grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm font-medium">{product.name}</div>
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={product.purchase_price}
                            onChange={(e) => updateProduct(product.id, "purchase_price", Number.parseFloat(e.target.value))}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={product.tax_value}
                            disabled
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => updateProduct(product.id, "quantity", Number.parseInt(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <div className="py-2 px-3">
                            USD {product.total_purchase_price.toFixed(2)}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-row w-full flex-wrap gap-3 mt-2">
                        <Button
                          onClick={() => removeProduct(product.id)}
                          variant={"outline"}
                          size={"sm"}
                          type="button"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setActiveModal({ type: "options", product_id: product.product_id, group_id: null })}
                          variant={"outline"}
                          size={"sm"}
                        >
                          <Settings className="w-3 h-3" />
                          Options
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setActiveModal({ type: "unit", product_id: product.id, group_id: null })}
                          variant={"outline"}
                          size={"sm"}
                        >
                          <Package className="w-3 h-3" />
                          Unit: {product.unit_id ? product.unit_quantities[0].unit.name : "N/A"}
                        </Button>
                        <Button
                          type="button"
                          variant={"outline"}
                          size={"sm"}
                          onClick={() => setActiveModal({ type: "tax", product_id: product.id, group_id: null })}
                        >
                          <Calculator className="w-3 h-3" />
                          Tax: {product.tax_group_id ? tax_groups.find((group) => group.id === product.tax_group_id)?.name : "N/A"}
                        </Button>
                        <Button
                          type="button"
                          variant={"outline"}
                          size={"sm"}
                          onClick={() => {
                            getConvertUnits(product.unit_group)
                            setActiveModal({ type: "convert", product_id: product.id, group_id: product.unit_group })
                          }}
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Convert: N/A
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Options Modal */}
                <Dialog
                  open={activeModal.type === "options"}
                  onOpenChange={() => {
                    setActiveModal({ type: null, product_id: null, group_id: null })
                  }}
                >
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Options</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">

                      <FormField
                        label="Expiration Date"
                        description="Define when that specific product should expire."
                      >
                        <DatePicker
                          onDateChange={(value) => updateProduct(activeModal.product_id as number, "expiration_date", value)}
                          date={form.data.products.find((p) => p.id === activeModal.product_id)?.expiration_date || null}
                        />
                      </FormField>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Barcode</Label>
                        <div className="h-16 dark:bg-input/30 bg-transparent rounded border flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Barcode will be generated</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Renders the automatically generated barcode.</p>
                      </div>

                      <FormField
                        label="Tax Type"
                        htmlFor="general_provider_id"
                        description={'Adjust how tax is calculated on the item.'}
                      // error={form.errors?.general_provider_id}
                      >
                        <Select
                          value={form.data.products.find((p) => p.id === activeModal.product_id)?.tax_type || "inclusive"}
                          onValueChange={(value) => updateProduct(activeModal.product_id as number, "tax_type", value)}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inclusive">Inclusive</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                    </div>
                  </DialogContent>
                </Dialog>

                {/* Unit Modal */}
                <Dialog open={activeModal.type === "unit"} onOpenChange={() => setActiveModal({ type: null, product_id: null, group_id: null })}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {form.data.products.find((p) => p.id === activeModal.product_id)?.name || "Product"}: Purchase Unit
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted border rounded-lg p-3">
                        <p className="text-sm text-blue-500">The product will be procured on that unit.</p>
                      </div>


                      <FormField
                        label=""
                        htmlFor="general_provider_id"
                        description=""
                      // error={form.errors?.general_payment_status}
                      >
                        <Select
                          value={form.data.products.find((p) => p.id === activeModal.product_id)?.unit_id?.toString() || ""}
                          onValueChange={(value) => updateProduct(activeModal.product_id as number, "unit_id", +value)}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {form.data.products.find((p) => p.id === activeModal.product_id)?.unit_quantities.map((unit) => {
                              return (
                                <SelectItem value={unit.unit_id.toString()}>{unit.unit.name}</SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Tax Modal */}
                <Dialog open={activeModal.type === "tax"} onOpenChange={() => setActiveModal({ type: null, product_id: null, group_id: null })}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Choose Tax</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted border rounded-lg p-3">
                        <p className="text-sm text-blue-500">The tax will be assigned to the procured product.</p>
                      </div>

                      <FormField
                        label=""
                        htmlFor="tax_group_id"
                        description=""
                      // error={form.errors?.general_payment_status}
                      >
                        <Select
                          value={form.data.products.find((p) => p.id === activeModal.product_id)?.tax_group_id?.toString() || ""}
                          onValueChange={(value) => {
                            const id = activeModal.product_id as number;
                            updateProduct(id, "tax_group_id", +value)
                            updateProduct(id, "tax_value", tax_groups.find((group) => group.id === +value)?.name || 0)
                          }}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {tax_groups.map((group) => {
                              return (
                                <SelectItem value={group.id.toString()}>{group.name}</SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </FormField>

                    </div>
                  </DialogContent>
                </Dialog>

                {/* Convert Modal */}
                <Dialog
                  open={activeModal.type === "convert"}
                  onOpenChange={() => {
                    setUnits([])
                    setActiveModal({ type: null, product_id: null, group_id: null })
                  }}
                >
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Convert to unit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">

                      <FormField
                        label=""
                        htmlFor="convert_unit_id"
                        description=""
                      >
                        <Select
                          value={form.data.products.find((p) => p.id === activeModal.product_id)?.convert_unit_id?.toString() || ""}
                          onValueChange={(value) => {
                            const id = activeModal.product_id as number;
                            updateProduct(id, "convert_unit_id", +value)
                            updateProduct(id, "convert_unit_label", units.find((unit) => unit.id === +value)?.name || 0)
                          }}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem value={unit.id.toString()}>{unit.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </AppLayout >
  );
}


