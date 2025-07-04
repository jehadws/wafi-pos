"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FormField from "@/components/forms/shared/form-field"
import type { TaxesTabProps, ProductFormData } from "./types"
import { usePage } from "@inertiajs/react"


export default function TaxesTab({ form, handleInputChange }: TaxesTabProps) {
  const { taxes } = usePage<{ taxes: { id: number, name: string }[] }>().props;
  const handleChange = (name: keyof ProductFormData, value: string | number | number[]) => {
    handleInputChange(name, value);

    if (form.errors[name]) form.clearErrors(name);
    if (form.errors.units_error) form.clearErrors("units_error");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Settings</CardTitle>
        <CardDescription>Configure tax settings for this product</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Tax Group ID"
          description="The tax group ID for this product"
          htmlFor="tax_group_id"
          error={form.errors?.taxes_tax_group_id}
        >
          <Select
            value={form.data.taxes_tax_group_id?.toString()}
            onValueChange={(value) => handleChange("taxes_tax_group_id", value)}
            defaultValue="Select Tax Group"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Tax Group" defaultValue={"Select Tax Group"} />
            </SelectTrigger>
            <SelectContent className="w-full">
              {taxes.map((tax) => (
                <SelectItem key={tax.id} value={tax.id.toString()}>
                  {tax.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Tax Type" htmlFor="taxes_tax_type" error={form.errors.taxes_tax_type}>
          <Select
            value={form.data.taxes_tax_type}
            onValueChange={(value: "inclusive" | "exclusive") => handleChange("taxes_tax_type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inclusive">Inclusive</SelectItem>
              <SelectItem value="exclusive">Exclusive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </CardContent>
    </Card>
  )
}

