import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RuleRow } from "./components/rule-row"
import AppLayout from "@/layouts/app-layout"
import { Head } from "@inertiajs/react"
import axios from "axios"
import { toast } from "sonner"

export default function AccountingRulesManager() {
  const [rules, setRules] = useState<TransactionRule[]>([])
  const [accounts, setAccounts] = useState<TransactionAccount[]>([])
  const [actions, setActions] = useState<{ [key: string]: string }>({})
  const [showNewRule, setShowNewRule] = useState(false)

  const getRules = async () => {
    try {
      const response = await axios.get("/api/transactions/rules")
      setRules(response.data)
    } catch (error) {
      console.error(error)
    }
  }


  const getAccounts = async () => {
    try {
      const response = await axios.get("/api/transactions-accounts")
      setAccounts(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const getActions = async () => {
    try {
      const response = await axios.get("/api/transactions-accounts/actions")
      setActions(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (rule: Partial<TransactionRule>) => {
    console.log("saving rule", rule)
    try {
      const { data } = await axios.post("/api/transactions/rules", { rule })
      console.log("saved rule", data)
      toast(data.message)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    console.log("saving rule", id)
    try {
      const { data } = await axios.delete(`/transactions/rules/${id}`)
      console.log("saved rule", data)
      toast(data.message)
    } catch (error) {
      console.error(error)
    } finally {
      setRules((prev) => prev.filter((rule) => rule.id !== id))
    }
  }

  useEffect(() => {
    getActions()
    getAccounts()
    getRules()
  }, [])

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title={"Rules - JGREM"} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="grid w-full">

          <div className="">
            <div className="border rounded-lg overflow-hidden">
              {rules.map((rule) => (
                <RuleRow accounts={accounts} actions={actions} key={rule.id} rule={rule} onSave={handleSave} onDelete={handleDelete} />
              ))}

              {showNewRule && <RuleRow accounts={accounts} actions={actions} isNew onSave={handleSave} />}
            </div>

            <div className="mt-6 text-center">
              <Button onClick={() => setShowNewRule(true)} variant="outline" className="flex w-full items-center gap-2">
                <Plus className="h-4 w-4" />
                Create a new rule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

