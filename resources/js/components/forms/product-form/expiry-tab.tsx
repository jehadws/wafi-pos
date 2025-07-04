"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FormField from "@/components/forms/shared/form-field"
import type { ExpiryTabProps, ProductFormData } from "./types"

export default function ExpiryTab({ form, handleInputChange }: ExpiryTabProps) {
  const handleChange = (name: keyof ProductFormData, value: string | number | number[]) => {
    handleInputChange(name, value);

    if (form.errors[name]) form.clearErrors(name);
    if (form.errors.expiracy_error) form.clearErrors("expiracy_error");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiry Settings</CardTitle>
        <CardDescription>Configure product expiration settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={form.data.expiracy_expires}
            onCheckedChange={(checked) => handleChange("expiracy_expires", checked)}
            id="expiracy_expires"
          />
          <Label htmlFor="expiracy_expires">Product expires</Label>
        </div>

        <FormField
          label="On Expiration"
          htmlFor="expiracy_on_expiration"
          error={form.errors?.expiracy_on_expiration}
        >
          <Select
            value={form.data.expiracy_on_expiration}
            onValueChange={(value: "allow_sales" | "prevent_sales") => handleChange("expiracy_on_expiration", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allow_sales">Allow Sales</SelectItem>
              <SelectItem value="prevent_sales">Prevent Sales</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </CardContent>
    </Card>
  );
}


