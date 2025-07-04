import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, Trash } from "lucide-react"
import FormField from "@/components/forms/shared/form-field"
import ToggleButtons from "@/components/forms/shared/toggle-buttons"
import type { ProductFormData } from "./types"
import { InertiaFormProps } from "@inertiajs/react"


// TODO: if there is no units on the group, show create unit button
// We were not able to load the units. Make sure there are units attached on the unit group selected.

interface SellingGroupCardProps {
  form: InertiaFormProps<ProductFormData>;
  index: number;
  onRemove: () => void;
  units: Unit[];
}

export default function SellingGroupCard({ form, units, index, onRemove }: SellingGroupCardProps) {
  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newSellingGroups = [...form.data.units_selling_group];
    newSellingGroups[index] = {
      ...newSellingGroups[index],
      [name]: value
    };

    form.setData({
      ...form.data,
      units_selling_group: newSellingGroups
    });


    // Clear errors
    if (form.errors[`units_selling_group.${index}.${name}`]) form.clearErrors(`units_selling_group.${index}.${name}`);
  };

  // Create a handler for select changes in this group
  const handleGroupSelectChange = (name: string, value: string | number | boolean) => {
    const newSellingGroups = [...form.data.units_selling_group];
    newSellingGroups[index] = {
      ...newSellingGroups[index],
      [name]: value
    };

    form.setData({
      ...form.data,
      units_selling_group: newSellingGroups
    });

    // Clear errors
    if (form.errors[`units_selling_group.${index}.${name}`]) form.clearErrors(`units_selling_group.${index}.${name}`);
  };

  const handleClearField = (name: string) => {
    const newSellingGroups = [...form.data.units_selling_group];
    newSellingGroups[index] = {
      ...newSellingGroups[index],
      [name]: ""
    };

    form.setData({
      ...form.data,
      units_selling_group: newSellingGroups
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Selling Group {index + 1}</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Assigned Unit" required error={form.errors?.["units_selling_group." + index + ".unit_id"]} description="The unit that is selected for conversion by default.">
            <Select
              value={form.data.units_selling_group[index].unit_id.toString()}
              onValueChange={(value) => handleGroupSelectChange("unit_id", +value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose..." />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id.toString()} value={unit.id.toString()}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Convert Unit" description="The unit that is selected for conversion by default." error={form.errors?.["units_selling_group." + index + ".convert_unit_id"]}>
            <Select
              value={form.data.units_selling_group[index].convert_unit_id.toString()}
              onValueChange={(value) => handleGroupSelectChange("convert_unit_id", +value)}
            >
              <div className="flex flex-row items-center gap-1">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose..." />
                </SelectTrigger>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleClearField("convert_unit_id")}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id.toString()} value={unit.id.toString()}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Sale Price" description="Define the regular selling price.">
            <Input
              name="sale_price_edit"
              value={form.data.units_selling_group[index].sale_price_edit}
              onChange={handleGroupChange}
              placeholder="10"
            />
          </FormField>

          <FormField label="Wholesale Price" description="Define the wholesale price.">
            <Input
              name="wholesale_price_edit"
              value={form.data.units_selling_group[index].wholesale_price_edit}
              onChange={handleGroupChange}
              placeholder="7"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="COGS" description="Used to define the Cost of Goods Sold.">
            <Input
              name="cogs"
              value={form.data.units_selling_group[index].cogs}
              onChange={handleGroupChange}
              placeholder="Enter COGS"
            />
          </FormField>

          <FormField label="Low Quantity" description="Which quantity should be assumed low.">
            <Input
              name="low_quantity"
              value={form.data.units_selling_group[index].low_quantity}
              onChange={handleGroupChange}
              placeholder="10"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Stock Alert" description="Define whether the stock alert should be enabled for this unit.">
            <ToggleButtons
              value={form.data.units_selling_group[index].stock_alert_enabled}
              onChange={(value) => handleGroupSelectChange("stock_alert_enabled", value)}
            />
          </FormField>

          <FormField label="Visible" description="Define whether the unit is available for sale.">
            <ToggleButtons
              value={form.data.units_selling_group[index].visible}
              onChange={(value) => handleGroupSelectChange("visible", value)}
            />
          </FormField>
        </div>

        <FormField label="Preview URL" description="Provide the preview of the current unit.">
          <div className="flex">
            <Input
              name="preview_url"
              value={form.data.units_selling_group[index].preview_url}
              onChange={handleGroupChange}
              placeholder="Enter preview URL"
              className="rounded-r-none"
            />
            <Button type="button" variant="outline" className="rounded-l-none border-l-0">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </FormField>
      </CardContent>
    </Card>
  )
}




