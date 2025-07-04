import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FormField from "@/components/forms/shared/form-field"
import { IdentificationTabProps, ProductFormData } from "./types"
import ToggleButtons from "../shared/toggle-buttons"
import { usePage } from "@inertiajs/react"


export default function IdentificationTab({ form, handleInputChange }: IdentificationTabProps) {
  const { categories } = usePage<{ categories: CategoryProduct[] }>().props;

  const handleChange = (name: keyof ProductFormData, value: string | number | number[]) => {
    handleInputChange(name, value);

    if (form.errors[name]) form.clearErrors(name);
    if (form.errors.identification_error) form.clearErrors("identification_error");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          label="Category"
          htmlFor="identification_category_id"
          description="Assign this product to a category."
          error={form.errors?.identification_category_id}
          required
        >
          <Select
            value={form.data.identification_category_id?.toString()}
            onValueChange={(value) => handleChange("identification_category_id", value)}
            defaultValue="Select category"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" defaultValue={"Select category"} />
            </SelectTrigger>
            <SelectContent className="w-full">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="SKU"
          htmlFor="identification_sku"
          description="Stock Keeping Unit, a unique identifier for this product."
          error={form.errors?.identification_sku}
        >
          <Input
            id="identification_sku"
            name="identification_sku"
            value={form.data.identification_sku}
            onChange={(e) => handleChange("identification_sku", e.target.value)}
            placeholder="Enter SKU"
            className={form.errors?.identification_sku ? "border-red-500" : ""}
          />
        </FormField>

        <FormField
          label="Barcode"
          htmlFor="identification_barcode"
          description="Define the barcode value."
          error={form.errors?.identification_barcode}
        >
          <Input
            id="identification_barcode"
            name="identification_barcode"
            value={form.data.identification_barcode}
            onChange={(e) => handleChange("identification_barcode", e.target.value)}
            placeholder="Enter barcode"
            className={form.errors?.identification_barcode ? "border-red-500" : ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          label="Barcode Type"
          htmlFor="identification_barcode_type"
          description="Define the barcode type scanned."
          error={form.errors?.identification_barcode_type}
        >
          <Select
            value={form.data.identification_barcode_type}
            onValueChange={(value) => handleChange("identification_barcode_type", value)}
            defaultValue="no"
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ean8">EAN 8</SelectItem>
              <SelectItem value="ean13">EAN 13</SelectItem>
              <SelectItem value="codabar">Codabar</SelectItem>
              <SelectItem value="code128">Code 128</SelectItem>
              <SelectItem value="code39">Code 39</SelectItem>
              <SelectItem value="code11">Code 11</SelectItem>
              <SelectItem value="upca">UPC A</SelectItem>
              <SelectItem value="upce">UPC E</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Type"
          htmlFor="identification_type"
          description="Define the product type."
          error={form.errors?.identification_type}
        >
          <Select
            value={form.data.identification_type}
            onValueChange={(value) => handleChange("identification_type", value)}
            defaultValue="materialized"
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materialized">Materialized Product</SelectItem>
              <SelectItem value="dematerialized">Dematerialized Product</SelectItem>
              <SelectItem value="grouped">Grouped Product</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Status"
          htmlFor="identification_status"
          description="Define whether the product is available for sale."
          error={form.errors?.identification_status}
        >
          <Select
            value={form.data.identification_status}
            onValueChange={(value) => handleChange("identification_status", value)}
            defaultValue="available"
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">On Sale</SelectItem>
              <SelectItem value="unavailable">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>


      <FormField
        label="Stock Management"
        htmlFor="identification_stock_management"
        description="Enable or disable stock management for this product."
        error={form.errors?.identification_stock_management}
      >
        <ToggleButtons
          value={form.data.identification_stock_management === "enabled"}
          onChange={(value) => handleChange("identification_stock_management", value ? "enabled" : "disabled")}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="identification_description"
        description="Provide a detailed description of the product."
        error={form.errors?.identification_description}
      >
        <Textarea
          id="identification_description"
          name="identification_description"
          value={form.data.identification_description || ""}
          onChange={(e) => handleChange("identification_description", e.target.value)}
          placeholder="Enter product description"
          className={form.errors?.identification_description ? "border-red-500" : ""}
          rows={4}
        />
      </FormField>
    </div>
  );
}

