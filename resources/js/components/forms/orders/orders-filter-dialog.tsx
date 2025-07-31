import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import FormField from "@/components/forms/shared/form-field";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { SelectTrigger } from "@/components/select";
import { Input } from "@/components/forms/shared/input";
import { usePage } from "@inertiajs/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

type Props = {
  isFilterOpen: boolean
  setIsFilterOpen: (value: boolean) => void
  handleResetFilters: () => void
  handleFilter: (filters: any) => void
}

export default function OrderFilterDialog({ isFilterOpen, setIsFilterOpen, handleResetFilters, handleFilter }: Props) {
  const { customers, users, registers } = usePage<{ orders: Order[], customers: Customer[], users: { id: number, username: string }[], registers: { id: number, name: string }[] }>().props;
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [PaymentStatus, setSelectedPaymentStatus] = useState<string | undefined>(undefined)
  const [Author, setSelectedAuthor] = useState<string | undefined>(undefined)
  const [Customer, setSelectedCustomer] = useState<string | undefined>(undefined)
  const [Register, setSelectedRegister] = useState<string | undefined>(undefined)
  const [CustomerPhone, setSelectedCustomerPhone] = useState<string | undefined>(undefined)


  const handleApplyFilter = () => {
    const queryFilters = {
      "jgrem_orders.created_at": {
        startDate: dateRange?.from ? format(dateRange?.from!, "yyyy-MM-dd HH:mm:ss") : null,
        endDate: dateRange?.to ? format(dateRange?.to!, "yyyy-MM-dd HH:mm:ss") : null
      },
      payment_status: PaymentStatus ? PaymentStatus : null,
      "jgrem_orders.author": Author ? Author : null,
      customer_id: Customer ? Customer : null,
      register_id: Register ? Register : null,
      customer_phone: CustomerPhone ? CustomerPhone : null
    };
    handleFilter(queryFilters)
  }

  const handleApplyReset = () => {
    handleResetFilters()
    setDateRange(undefined)
    setSelectedPaymentStatus(undefined)
    setSelectedAuthor(undefined)
    setSelectedCustomer(undefined)
    setSelectedRegister(undefined)
    setSelectedCustomerPhone(undefined)
  }

  return (
    <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <DialogContent className={cn("max-w-[50vw] sm:max-w-[50vw] w-[50vw] flex flex-col")}>
        <DialogTitle>Search Filters</DialogTitle>
        <DialogDescription className="sr-only">Search Filters</DialogDescription>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="col-span-2">
            <FormField label="Date Range">
              <div className="flex flex-row items-center gap-2">
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  placeholder={""}
                  disabled={false}
                  className={""}
                />

                <Button variant={"destructive"} size="icon" onClick={() => setDateRange(undefined)}>
                  <Trash2 />
                </Button>
              </div>
            </FormField>
          </div>
          <FormField label="Payment Status">
            <Select value={PaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="order_void">Order Void</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="partially_due">Partially Due</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Author">
            <Select value={Author} onValueChange={setSelectedAuthor}>
              <SelectTrigger>
                <SelectValue placeholder="Select Author" />
              </SelectTrigger>
              <SelectContent>
                {users.map((customer) => {
                  return <SelectItem key={customer.id} value={customer.id.toString()}>{customer.username}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Customer">
            <Select value={Customer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => {
                  return <SelectItem key={customer.id} value={customer.id.toString()}>{customer.first_name} {customer.last_name}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Customer Phone">
            <Input
              type="text"
              placeholder="Customer Phone"
              className={cn("bg-dark")}
              value={CustomerPhone}
              onChange={(e) => setSelectedCustomerPhone(e.target.value)}
            />
          </FormField>

          <FormField label="Cashier Register">
            <Select value={Register} onValueChange={setSelectedRegister}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {registers.map((register) => {
                  return <SelectItem key={register.id} value={register.id.toString()}>{register.name}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <DialogFooter>
          <div className="flex w-full flex-row justify-between items-center mt-2">
            <Button onClick={handleApplyReset} variant={"destructive"}>Clear Filters</Button>
            <Button onClick={handleApplyFilter}>Apply</Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

