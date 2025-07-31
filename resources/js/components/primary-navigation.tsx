import { Button } from "@/components/ui/button"
import { router } from "@inertiajs/react"
import { LayoutDashboard, ShoppingCart, Users, RotateCcw, Truck } from "lucide-react"

interface PrimaryNavigationProps {
  resetCart: () => void
  handleOpenSelectCustomerDialog: (open: boolean) => void
  handleOpenOrderDialog: (open: boolean) => void
  handleOpenOrderTypeDialog: (open: boolean) => void
}

export default function PrimaryNavigation({ resetCart, handleOpenOrderTypeDialog, handleOpenSelectCustomerDialog, handleOpenOrderDialog }: PrimaryNavigationProps) {
  return (
    <div className="border-b bg-background p-2">
      <div className="flex space-x-2">
        <Button
          variant={"default"}
          onClick={() => router.visit("/dashboard")}
          className="flex items-center"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={"outline"}
          className="flex items-center"
          onClick={() => handleOpenOrderDialog(true)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Orders
        </Button>
        <Button
          variant={"outline"}
          className="flex items-center"
          onClick={() => handleOpenOrderTypeDialog(true)}
        >
          <Truck className="mr-2 h-4 w-4" />
          Order Type
        </Button>
        <Button
          variant={"outline"}
          className="flex items-center"
          onClick={() => handleOpenSelectCustomerDialog(true)}
        >
          <Users className="mr-2 h-4 w-4" />
          Customers
        </Button>
        <Button variant="destructive" onClick={resetCart} className="flex items-center ml-auto">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  )
}
