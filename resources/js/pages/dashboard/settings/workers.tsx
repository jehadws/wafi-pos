import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AppLayout from "@/layouts/app-layout"
import { useForm, usePage } from "@inertiajs/react"
import FormField from "@/components/forms/shared/form-field"
import axios from "axios"

type General = {
  ns_workers_enabled: string | null
}

type Payload = {
  general: General
}

type Option = {
  label: string
  value: string | number
}

type Options = {
  ns_reports_email: Option[]
}


export default function SettingsGeneral() {
  const { payload } = usePage<{ options: Options, payload: General }>().props
  const [isPending, startTransition] = useTransition()

  const form = useForm<Payload>({
    general: {
      ...payload
    },
  })

  const handleSave = () => {
    startTransition(async () => {
      try {
        await axios.post("/api/settings/workers", form.data)
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
              <h1 className="text-2xl font-semibold">Workers Settings</h1>
              <p className="text-sm text-muted-foreground">Configure how background operations works.</p>
              <div className="mt-4">
              </div>

              <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-2">
                <FormField label="Enable Workers" description='Enable background services for NexoPOS. Refresh to check whether the option has turned to "Yes".'>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={(form.data.general.ns_workers_enabled ?? "no") === "yes" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_workers_enabled", "await_confirm")}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={(form.data.general.ns_workers_enabled ?? "no") === "await_confirm" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_workers_enabled", "await_confirm")}
                    >
                      Test
                    </Button>
                    <Button
                      type="button"
                      variant={(form.data.general.ns_workers_enabled ?? "no") === "no" ? "default" : "outline"}
                      onClick={() => form.setData("general.ns_workers_enabled", "no")}
                    >
                      No
                    </Button>
                  </div>
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


