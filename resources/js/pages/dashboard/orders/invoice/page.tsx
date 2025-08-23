import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout";
import { formatCurrency } from "@/utils/format";
import { Head, usePage } from "@inertiajs/react"
import { Printer } from "lucide-react"

export default function OrderInvoicePage() {
  const {
    order,
    options,
    billing,
    shipping,
    title
  } = usePage<{ order: Order, options: OrderType, billing: Address, shipping: Address, title: string }>().props;

  console.log("order", order);
  console.log("options", options);
  console.log("billing", billing);
  console.log("shipping", shipping);
  console.log("title", title);

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title={title} />
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto rounded-lg shadow-sm border">
          {/* Header */}
          <div className="bg-muted px-6 py-4 rounded-t-lg">
            <h1 className="text-2xl font-semibold" dangerouslySetInnerHTML={{ __html: title }}></h1>
            <p className="text-sm text-muted-foreground mt-1">No description</p>
          </div>

          <div className="p-6">
            {/* Print Button */}
            <div className="mb-6">
              <Button className="">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Store Details */}
              <div>
                <h2 className="text-lg font-semibold text-muted-forground mb-4">Store Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="">Order Code</span>
                    <span className="text-muted-forground">{order.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Cashier</span>
                    <span className="text-muted-forground">{order.user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Date</span>
                    <span className="text-muted-forground">{order.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Customer</span>
                    <span className="text-muted-forground">{order.customer.first_name} {order.customer.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Type</span>
                    <span className="text-muted-forground">{order.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Payment Status</span>
                    <span className="text-muted-forground">{order.paymentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div>
                <h2 className="text-lg font-semibold text-muted-forground mb-4">Billing Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="">First Name</span>
                    <span className="text-gray-500">{order.billing_address.first_name ? order.billing_address.first_name : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Last Name</span>
                    <span className="text-gray-500">{order.billing_address.last_name ? order.billing_address.last_name : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Phone</span>
                    <span className="text-gray-500">{order.billing_address.phone ? order.billing_address.phone : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Address 1</span>
                    <span className="text-gray-500">{order.billing_address.address_1 ? order.billing_address.address_1 : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Address 2</span>
                    <span className="text-gray-500">{order.billing_address.address_2 ? order.billing_address.address_2 : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Country</span>
                    <span className="text-gray-500">{order.billing_address.country ? order.billing_address.country : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">City</span>
                    <span className="text-gray-500">{order.billing_address.city ? order.billing_address.city : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">P.O.Box</span>
                    <span className="text-gray-500">{order.billing_address.pobox ? order.billing_address.pobox : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Company</span>
                    <span className="text-gray-500">{order.billing_address.company ? order.billing_address.company : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Email</span>
                    <span className="text-gray-500">{order.billing_address.email ? order.billing_address.email : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              <div>
                <h2 className="text-lg font-semibold text-muted-forground mb-4">Shipping Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="">First Name</span>
                    <span className="text-gray-500">{order.shipping_address.first_name ? order.shipping_address.first_name : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Last Name</span>
                    <span className="text-gray-500">{order.shipping_address.last_name ? order.shipping_address.last_name : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Phone</span>
                    <span className="text-gray-500">{order.shipping_address.phone ? order.shipping_address.phone : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Address 1</span>
                    <span className="text-gray-500">{order.shipping_address.address_1 ? order.shipping_address.address_1 : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Address 2</span>
                    <span className="text-gray-500">{order.shipping_address.address_2 ? order.shipping_address.address_2 : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Country</span>
                    <span className="text-gray-500">{order.shipping_address.country ? order.shipping_address.country : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">City</span>
                    <span className="text-gray-500">{order.shipping_address.city ? order.shipping_address.city : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">P.O.Box</span>
                    <span className="text-gray-500">{order.shipping_address.pobox ? order.shipping_address.pobox : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Company</span>
                    <span className="text-gray-500">{order.shipping_address.company ? order.shipping_address.company : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Email</span>
                    <span className="text-gray-500">{order.shipping_address.email ? order.shipping_address.email : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted grid grid-cols-6 gap-4 p-4 font-semibold">
                <div>Product</div>
                <div className="text-center">Unit Price</div>
                <div className="text-center">Quantity</div>
                <div className="text-center">Discount</div>
                <div className="text-center">Tax</div>
                <div className="text-center">Total Price</div>
              </div>
              {order.products.map((product) => (
                <div className="grid grid-cols-6 gap-4 p-4 border-b">
                  <div className="text-muted-forground">{product.name}</div>
                  <div className="text-center text-muted-forground">{formatCurrency(product.unit_price)}</div>
                  <div className="text-center text-muted-forground">{product.quantity}</div>
                  <div className="text-center text-muted-forground">{formatCurrency(product.discount)}</div>
                  <div className="text-center text-muted-forground">{formatCurrency(product.tax_value * product.quantity)}</div>
                  <div className="text-center text-muted-forground">{formatCurrency(product.total_price)}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Sub Total</span>
                  <span className="text-muted-forground">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Discount</span>
                  <span className="text-muted-forground">{formatCurrency(-order.discount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="font-semibold">Total</span>
                  <span className="text-muted-forground">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Paid</span>
                  <span className="text-muted-forground">{formatCurrency(order.tendered)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Change</span>
                  <span className="text-muted-forground">{formatCurrency(order.change)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
