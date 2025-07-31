import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PaymentMethodSidebar } from "./payment-method-sidebar"
import { NumberPad } from "./number-pad"
import { formatCurrency } from "@/utils/format"
import SummaryCard from "./payment-summary-card"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Trash2 } from "lucide-react"
import { InertiaFormProps } from "@inertiajs/react"
import { ScrollArea } from "../ui/scroll-area"
import ConfirmationDialog from "../confirmation-dialog"
import { toast } from "sonner"
import axios from "axios"

export const PAYMENT_METHODS: Record<PaymentTypes, string> = {
  "cash-payment": "Cash Payment",
  "bank-payment": "Bank Payment",
  "customer-payment": "Customer Payment",
} as const;

interface PaymentGatewayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: InertiaFormProps<OrderFormValuesType>
  useBillingAddress: boolean
  useShippingAddress: boolean
  resetCart: () => void
}

export function PaymentGatewayDialog({ open, onOpenChange, form, useShippingAddress, useBillingAddress, resetCart }: PaymentGatewayProps) {
  const [tab, setTab] = useState<PaymentTypes | "payment-list">("cash-payment")
  const [screenValue, setScreenValue] = useState("0.00")
  const [rawValue, setRawValue] = useState(0);
  const [isSaveAsUnpaidOpen, setIsSaveAsUnpaidOpen] = useState(false)
  const [isConfirmFullPaymentOpen, setIsConfirmFullPaymentOpen] = useState(false)

  const paid = form.data.payments.reduce((sum, p) => sum + p.value, 0)
  const total = form.data.total
  const change = form.data.change

  const handleNumberInput = (digit: string) => {
    if (!/^\d$/.test(digit)) return; // ignore anything not 0-9

    const newRaw = rawValue * 10 + parseInt(digit, 10);
    setRawValue(newRaw);

    // Convert cents to decimal string
    const newFormatted = (newRaw / 100).toFixed(2);
    setScreenValue(newFormatted);
  }

  const handleBackspace = () => {
    const newRaw = Math.floor(rawValue / 10);
    setRawValue(newRaw);
    setScreenValue((newRaw / 100).toFixed(2));
  }

  const handleFullPayment = (paymentType: PaymentTypes) => {
    if (total <= paid) return
    const payment: TPaymentMethod = {
      identifier: paymentType,
      value: total - paid,
      label: PAYMENT_METHODS[paymentType],
      selected: false,
      readonly: false,
    }

    form.setData("payments", [...form.data.payments, payment])
    setScreenValue("0.00")
    setRawValue(0)
  }

  const handleConfirmPayment = (paymentType: PaymentTypes) => {
    const amount = Number.parseFloat(screenValue)
    if (amount <= 0) return
    const payment: TPaymentMethod = {
      identifier: paymentType,
      value: amount,
      label: PAYMENT_METHODS[paymentType],
      selected: false,
      readonly: false,
    }
    form.setData("payments", [...form.data.payments, payment])
    setScreenValue("0.00")
    setRawValue(0)
  }

  const handleRemovePayment = (identifier: string, value: number) => {
    const payments = [...form.data.payments]
    const index = payments.findIndex(
      (item) => item.identifier === identifier && item.value === value
    )

    if (index !== -1) {
      payments.splice(index, 1)
      form.setData("payments", payments)
    }
  }

  const onTabSelect = (method: PaymentTypes | "payment-list") => {
    setTab(method)
    setScreenValue("0.00")
  }

  const handleUpdate = async () => {
    if (form.data.id) {
      try {
        const res = await axios.put(`/api/orders/${form.data.id}`, {
          ...form.data,
          payment_status: "unpaid",
          customer: {
            ...form.data.customer,
            selected: true
          },
          addresses: {
            billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
            shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
          },
        })

        if (res.data) {
          toast.success("Order Updated")
          resetCart()
        }
      } catch (error) {
        console.log(error)
        toast.error("Something went wrong. Please try again.")
      }
    } else {
      try {
        const res = await axios.put("/api/orders", {
          ...form.data,
          payment_status: "unpaid",
          customer: {
            ...form.data.customer,
            selected: true
          },
          addresses: {
            billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
            shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
          },
        })
        if (res.data) {
          toast.success("Order Updated")
          resetCart()
        }
      } catch (error) {
        console.log(error)
        toast.error("Something went wrong. Please try again.")
      }
    }

  }

  const handleLayaway = () => {
    // payment_status : "unpaid"
    console.log("Payment layaway:", {
      ...form.data
    })

    toast.success("Partially paid orders are disabled.")
  }

  const handleSaveAsUnpaid = async () => {
    // payment_status : "unpaid"
    if (form.data.id) {
      try {
        const res = await axios.put(`/api/orders/${form.data.id}`, {
          ...form.data,
          customer: {
            ...form.data.customer,
            selected: true
          },
          addresses: {
            billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
            shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
          },
        })

        if (res.data) {
          toast.success("Order Placed as Unpaid")
          resetCart()
        }
      } catch (error) {
        console.log(error)
        toast.error("Something went wrong. Please try again.")
      }
    } else {
      try {
        const res = await axios.post("/api/orders", {
          ...form.data,
          customer: {
            ...form.data.customer,
            selected: true
          },
          addresses: {
            billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
            shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
          },
        })

        if (res.data) {
          toast.success("Order Placed as Unpaid")
          resetCart()
        }
      } catch (error) {
        console.log(error)
        toast.error("Something went wrong. Please try again.")
      }
    }
  }

  const handleSubmitPayment = async () => {
    if (form.data.id) {
      try {
        const res = await axios.put(`/api/orders/${form.data.id}`, {
          ...form.data,
          customer: {
            ...form.data.customer,
            selected: true
          },
          payment_status: "paid",
          addresses: {
            billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
            shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
          },
        })

        if (res.data) {
          toast.success("Order Placed")
          resetCart()
        }
      } catch (error) {
        console.log(error)
        toast.error("Something went wrong. Please try again.")
      }
    } else {
      try {
        const res = await axios.post("/api/orders", {
          ...form.data,
          customer: {
            ...form.data.customer,
            selected: true
          },
          payment_status: "paid",
          addresses: {
            billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
            shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
          },
        })

        if (res.data) {
          toast.success("Order Placed")
          resetCart()
        }
      } catch (error) {
        console.log(error)
        toast.error("Something went wrong. Please try again.")
      }
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-[95vw] bg-card sm:max-w-[95vw] max-h-[90vh] w-[95vw] h-[90vh] p-0 gap-0 flex flex-col")}>
        <DialogTitle className="sr-only">Payment Gateway</DialogTitle>
        <DialogDescription className="sr-only">Payment Gateway</DialogDescription>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Gateway : {PAYMENT_METHODS["cash-payment"] ? "Payment Gateway" : "Payment List"}</h2>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <PaymentMethodSidebar
            selectedTab={tab}
            onTabSelect={onTabSelect}
            totalPayment={form.data.payments.length}
          />
          <div className="flex-1">
            {/* Main Content */}
            {tab !== "payment-list" && (
              <div className="flex-1 p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <SummaryCard label="Total" amount={form.data.total} variant="total" />
                  <SummaryCard label="Discount" amount={form.data.discount} variant="discount" />
                  <SummaryCard label="Paid" amount={paid} variant="paid" />
                  <SummaryCard
                    label="Change"
                    amount={change}
                    variant="change"
                    isNegative={true}
                  />
                </div>

                {/* Screen Display */}
                <div className="border-border border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Screen :</span>
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(Number.parseFloat(screenValue) || 0)}</span>
                  </div>
                </div>

                {/* Number Pad */}
                <NumberPad
                  onNumberClick={handleNumberInput}
                  onBackspace={handleBackspace}
                  onConfirm={() => handleConfirmPayment(tab)}
                  handleFullPayment={() => setIsConfirmFullPaymentOpen(true)}
                />
              </div>
            )}


            {tab === "payment-list" && (
              <ScrollArea className="min-h-[150px] h-full">
                <div className="flex-1 p-3 space-y-2">
                  {form.data.payments.map((payment, index) => (
                    <div key={index} className="border-border border bg-background/20 rounded-lg px-4 py-2">
                      <div className="flex gap-4 items-center">
                        <span className="text-foreground flex-1">{payment.label}</span>
                        <span className="font-bold text-foreground">{formatCurrency(payment.value)}</span>
                        <Button variant={"outline"} size={"icon"} className="hover:cursor-pointer" onClick={() => handleRemovePayment(payment.identifier, payment.value)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border gap-4">
          {(form.data.tendered > 0 && form.data.tendered < form.data.total) && (
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 px-6">
              Update
            </Button>
          )}
          {form.data.tendered === 0 && (
            <>
              <Button onClick={handleLayaway} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 px-6">
                Layaway - {formatCurrency(form.data.tendered)}
              </Button>
              <Button onClick={() => setIsSaveAsUnpaidOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 px-6">
                Save As Unpaid
              </Button>
            </>
          )}

          {form.data.tendered >= form.data.total && (
            <Button onClick={() => handleSubmitPayment()} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 px-6">
              Submit Payment
            </Button>
          )}
        </div>

        <ConfirmationDialog
          isOpen={isSaveAsUnpaidOpen}
          onClose={() => setIsSaveAsUnpaidOpen(false)}
          onConfirm={() => {
            handleSaveAsUnpaid()
            setIsSaveAsUnpaidOpen(false)
          }}
          title="Save As Unpaid"
          description="Are you sure you want to save this order as unpaid?"
        />

        <ConfirmationDialog
          isOpen={isConfirmFullPaymentOpen}
          onClose={() => setIsConfirmFullPaymentOpen(false)}
          onConfirm={() => {
            handleFullPayment(tab as PaymentTypes)
            setIsConfirmFullPaymentOpen(false)
          }}
          title="Confirm Full Payment"
          description={`A full payment will be made using ${PAYMENT_METHODS[tab as PaymentTypes]} for ${formatCurrency(form.data.total)}`}
        />
      </DialogContent>
    </Dialog>
  )
}
