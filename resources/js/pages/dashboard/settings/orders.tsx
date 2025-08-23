import { useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AppLayout from "@/layouts/app-layout"
import { useForm, usePage } from "@inertiajs/react"
import FormField from "@/components/forms/shared/form-field"
import axios from "axios"

type General = {
  ns_orders_code_type: string | null
  ns_orders_allow_unpaid: string | null
  ns_orders_allow_partial: string | null
  ns_orders_strict_instalments: string | null
  ns_orders_quotation_expiration: string | null
}

type Payload = {
  general: General
}

type Option = {
  label: string
  value: string | number
}

type Options = {
  ns_orders_code_type: Option[]
  ns_orders_allow_unpaid: Option[]
  ns_orders_allow_partial: Option[]
  ns_orders_strict_instalments: Option[]
  ns_orders_quotation_expiration: Option[]
}


export default function SettingsGeneral() {
  const { options, payload } = usePage<{ options: Options, payload: General }>().props
  const [isPending, startTransition] = useTransition()

  const form = useForm<Payload>({
    general: {
      ...payload
    },
  })

  const handleSave = () => {
    startTransition(async () => {
      try {
        const data = {
          general: {
            ...form.data.general,
            ns_orders_code_type: form.data.general.ns_orders_code_type === "null" ? null : form.data.general.ns_orders_code_type,
            ns_orders_quotation_expiration: form.data.general.ns_orders_quotation_expiration === "null" ? null : form.data.general.ns_orders_quotation_expiration,
          }
        }
        await axios.post("/api/settings/orders", data)
        toast("Settings saved", { description: `The settings was saved successfully.` })
      } catch (e: any) {
        toast("Failed to save", {
          description: e?.message || "An unexpected error occurred.",
        })
      }
    })
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-xl border">
            <div className="relative p-6 md:p-8">
              <h1 className="text-2xl font-semibold">Orders Settings</h1>
              <p className="text-sm text-muted-foreground">Configure settings that applies to orders.</p>
              <div className="mt-4">
              </div>

              <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                <FormField label="Enable Reward" description="Will activate the reward system for the customers.">
                  <Select
                    value={form.data.general.ns_orders_code_type || ""}
                    onValueChange={(v) => form.setData("general.ns_orders_code_type", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key={"null"} value={"null"}>
                        Select an option
                      </SelectItem>
                      {options.ns_orders_code_type.map((l) => (
                        <SelectItem key={l.value} value={l.value.toString()}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Allow Unpaid Orders" description='Will prevent incomplete orders to be placed. If credit is allowed, this option should be set to "yes".'>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={(form.data.general.ns_orders_allow_unpaid ?? "yes") === "yes" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_orders_allow_unpaid", "yes")}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={(form.data.general.ns_orders_allow_unpaid ?? "yes") === "no" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_orders_allow_unpaid", "no")}
                    >
                      No
                    </Button>
                  </div>
                </FormField>
                <FormField label="Allow Partial Orders" description="Will prevent partially paid orders to be placed.">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={(form.data.general.ns_orders_allow_partial ?? "yes") === "yes" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_orders_allow_partial", "yes")}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={(form.data.general.ns_orders_allow_partial ?? "yes") === "no" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_orders_allow_partial", "no")}
                    >
                      No
                    </Button>
                  </div>
                </FormField>

                <FormField label="Strict Instalments" description="Will enforce instalment to be paid on specific date.">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={(form.data.general.ns_orders_strict_instalments ?? "yes") === "yes" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_orders_strict_instalments", "yes")}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={(form.data.general.ns_orders_strict_instalments ?? "yes") === "no" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_orders_strict_instalments", "no")}
                    >
                      No
                    </Button>
                  </div>
                </FormField>
                <FormField label="Quotation Expiration" description="Quotations will get deleted after they defined they has reached.">
                  <Select
                    value={form.data.general.ns_orders_quotation_expiration || ""}
                    onValueChange={(v) => form.setData("general.ns_orders_quotation_expiration", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key={"null"} value={"null"}>
                        Select an option
                      </SelectItem>
                      {options.ns_orders_quotation_expiration.map((l) => (
                        <SelectItem key={l.value} value={l.value.toString()}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

            </div>
            <div className="mt-6 flex items-center justify-end rounded-b-xl border-t p-3">
              <Button onClick={() => handleSave()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

