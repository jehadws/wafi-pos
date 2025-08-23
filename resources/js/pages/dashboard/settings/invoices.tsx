import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Eye, Save, Upload, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AppLayout from "@/layouts/app-layout"
import { useForm, usePage } from "@inertiajs/react"
import FormField from "@/components/forms/shared/form-field"
import { toast } from "sonner"
import axios from "axios"

type General = {
  ns_invoice_display_tax_breakdown: string | null
  ns_invoice_merge_similar_products: string | null
  ns_invoice_receipt_column_a: string | null
  ns_invoice_receipt_column_b: string | null
  ns_invoice_receipt_footer: string | null
  ns_invoice_receipt_logo: string | null
  ns_invoice_receipt_template: string | null
}

type Payload = {
  receipts: General
}

type Option = {
  label: string
  value: string | number
}

type Options = {
  ns_invoice_receipt_template: Option[]
  ns_invoice_merge_similar_products: Option[]
  ns_invoice_display_tax_breakdown: Option[]
}

const availableTags = [
  { tag: "{store_name}", description: "displays the store name" },
  { tag: "{store_email}", description: "displays the store email" },
  { tag: "{store_phone}", description: "displays the store phone number" },
  { tag: "{cashier_name}", description: "displays the cashier name" },
  { tag: "{cashier_id}", description: "displays the cashier id" },
  { tag: "{order_code}", description: "displays the order code" },
  { tag: "{order_date}", description: "displays the order date" },
  { tag: "{order_type}", description: "displays the order type" },
  { tag: "{customer_first_name}", description: "displays the customer first name" },
  { tag: "{customer_last_name}", description: "displays the customer last name" },
  { tag: "{customer_email}", description: "displays the customer email" },
  { tag: "{customer_phone}", description: "displays the customer phone" },
  { tag: "{total_amount}", description: "displays the total amount" },
  { tag: "{tax_amount}", description: "displays the tax amount" },
  { tag: "{discount_amount}", description: "displays the discount amount" },
  { tag: "{payment_method}", description: "displays the payment method" },
  { tag: "{change_amount}", description: "displays the change amount" },
]

export default function ReceiptSettings() {
  const { options, payload } = usePage<{ options: Options, payload: General }>().props
  const [isPending, startTransition] = useTransition()

  const form = useForm<Payload>({
    receipts: {
      ...payload
    },
  })

  const handleSave = () => {
    startTransition(async () => {
      try {
        await axios.post("/api/settings/orders", form.data)
        toast("Settings saved", { description: `The settings was saved successfully.` })
      } catch (e: any) {
        toast("Failed to save", {
          description: e?.message || "An unexpected error occurred.",
        })
      }
    })
  }

  const [activeTextarea, setActiveTextarea] = useState<string | null>(null)

  const insertTag = (tag: string, targetField: string) => {
    const textarea = document.getElementById(targetField) as HTMLTextAreaElement
    if (textarea) {
      // const start = textarea.selectionStart
      // const end = textarea.selectionEnd
      // const currentValue = settings[targetField as keyof ReceiptSettings] as string
      // const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end)
      //
      // handleSettingChange(targetField as keyof ReceiptSettings, newValue)

      // Restore cursor position
      // setTimeout(() => {
      //   textarea.focus()
      //   textarea.setSelectionRange(start + tag.length, start + tag.length)
      // }, 0)
    }
  }

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag)
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="space-y-6">
          <div className="relative overflow-hidden">
            <div className="relative flex flex-row items-center justify-between py-6">
              <div>
                <h1 className="text-2xl font-semibold">Invoice Settings</h1>
                <p className="text-sm text-muted-foreground">Configure how invoice and receipts are used.</p>
              </div>

              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Settings */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Configuration</CardTitle>
                    <CardDescription>Set up the basic receipt template and branding</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Receipt Template" description='Choose the template that applies to receipts'>
                        <Select value={form.data.receipts.ns_invoice_receipt_template} onValueChange={(value) => form.setData("receipts.ns_invoice_receipt_template", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key={"null"} value={"null"}>
                              Select an option
                            </SelectItem>
                            {options.ns_invoice_receipt_template.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Receipt Logo" description='Provide a URL to the logo.'>
                        <div className="flex gap-2">
                          <Input
                            id="logoUrl"
                            placeholder="https://example.com/logo.png"
                            value={form.data.receipts.ns_invoice_receipt_logo || ""}
                            onChange={(e) => form.setData("receipts.ns_invoice_receipt_logo", e.target.value)}
                          />
                          <Button variant="outline" size="icon">
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Show Tax Breakdown" description='Will display the tax breakdown on the receipt/invoice.'>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={(form.data.receipts.ns_invoice_display_tax_breakdown ?? "no") === "yes" ? "default" : "outline"}
                            onClick={() => form.setData("receipts.ns_invoice_display_tax_breakdown", "yes")}
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={(form.data.receipts.ns_invoice_display_tax_breakdown ?? "no") === "no" ? "default" : "outline"}
                            onClick={() => form.setData("receipts.ns_invoice_display_tax_breakdown", "no")}
                          >
                            No
                          </Button>
                        </div>
                      </FormField>

                      <FormField label="Merge Products On Receipt/Invoice" description='All similar products will be merged to avoid a paper waste for the receipt/invoice.'>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={(form.data.receipts.ns_invoice_merge_similar_products ?? "no") === "yes" ? "default" : "outline"}
                            onClick={() => form.setData("receipts.ns_invoice_merge_similar_products", "yes")}
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={(form.data.receipts.ns_invoice_merge_similar_products ?? "no") === "no" ? "default" : "outline"}
                            onClick={() => form.setData("receipts.ns_invoice_merge_similar_products", "no")}
                          >
                            No
                          </Button>
                        </div>
                      </FormField>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custom Content</CardTitle>
                    <CardDescription>Customize the header and footer content of your receipts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="header" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 border h-10">
                        <TabsTrigger value="header" className="data-[state=active]:bg-accent -mt-0.4 data-[state=active]:text-accent-foreground dark:data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-accent">Header Content</TabsTrigger>
                        <TabsTrigger value="footer" className="data-[state=active]:bg-accent -mt-0.4 data-[state=active]:text-accent-foreground dark:data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-accent">Footer Content</TabsTrigger>
                      </TabsList>

                      <TabsContent value="header" className="space-y-4 mt-3">
                        <div className="space-y-2">
                          <Label htmlFor="headerContent">Header Content</Label>
                          <Textarea
                            id="headerContent"
                            placeholder="Add custom header content here..."
                            value={form.data.receipts.ns_invoice_receipt_column_a || ""}
                            onChange={(e) => form.setData("receipts.ns_invoice_receipt_column_a", e.target.value)}
                            onFocus={() => setActiveTextarea("headerContent")}
                            className="min-h-[120px] font-mono text-sm"
                          />
                          <p className="text-sm text-muted-foreground">This content will appear at the top of your receipts</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="footer" className="space-y-4 mt-3">
                        <div className="space-y-2">
                          <Label htmlFor="footerContent">Footer Content</Label>
                          <Textarea
                            id="footerContent"
                            placeholder="Add custom footer content here..."
                            value={form.data.receipts.ns_invoice_receipt_footer || ""}
                            onChange={(e) => form.setData("receipts.ns_invoice_receipt_footer", e.target.value)}
                            onFocus={() => setActiveTextarea("footerContent")}
                            className="min-h-[120px] font-mono text-sm"
                          />
                          <p className="text-sm text-muted-foreground">This content will appear at the bottom of your receipts</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Available Tags Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Available Tags
                    </CardTitle>
                    <CardDescription>
                      Click any tag to copy it, or click the insert button to add it to the active text area
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {availableTags.map((item) => (
                        <div key={item.tag} className="group">
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg border hover:bg-muted-foreground/20 transition-colors">
                            <div className="flex-1 min-w-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="secondary"
                                    className="font-mono text-xs cursor-pointer"
                                    onClick={() => copyTag(item.tag)}
                                  >
                                    {item.tag}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click to copy</p>
                                </TooltipContent>
                              </Tooltip>
                              <p className="text-xs text-gray-500 mt-1 leading-tight">{item.description}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyTag(item.tag)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy tag</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
