import { Button } from "@/components/ui/button"
import { CreditCard, PauseCircle, Percent, XCircle } from "lucide-react"

export default function PaymentActions() {
  return (
    <div className="grid grid-cols-4 gap-px">
      <Button className="rounded-none py-6" variant="default">
        <CreditCard className="mr-2 h-5 w-5" />
        Pay
      </Button>
      <Button className="rounded-none py-6" variant="secondary">
        <PauseCircle className="mr-2 h-5 w-5" />
        Hold
      </Button>
      <Button className="rounded-none py-6" variant="outline">
        <Percent className="mr-2 h-5 w-5" />
        Discount
      </Button>
      <Button className="rounded-none py-6" variant="destructive">
        <XCircle className="mr-2 h-5 w-5" />
        Void
      </Button>
    </div>
  )
}
