import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePOS } from "@/hooks/usePOS";
import { formatCurrency } from "@/utils/format";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SelectUnitQuantityDialog({
  selectProduct,
}: {
  selectProduct: Product | undefined
}) {
  const { openDialogs, closeDialog } = usePOS();
  const open = openDialogs["selectQuantity"] || false
  const [quantities, setQuantities] = useState<UnitQuantity[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadQuantities = async (product: Product) => {
    try {
      setQuantities([])
      setIsLoading(true)
      const res = await axios.get(`/api/products/${product.id}/units/quantities`)

      if (res.data.length === 0) {
        closeDialog("selectQuantity", null)
        return toast.error('This product doesn\'t have any unit defined for selling. Make sure to mark at least one unit as visible.');
      }

      setQuantities(res.data)

      /**
       * This will automatically
       * select a unit if there is only one unit available.
       */
      if (quantities.length === 1) {
        closeDialog("selectQuantity", res.data[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const selectUnit = (unit: UnitQuantity) => {
    if (unit.unit === null) {
      toast.error('The unit attached to this product is missing or not assigned. Please review the "Unit" tab for this product.');

      return closeDialog("selectQuantity", null);
    }
    closeDialog("selectQuantity", unit)
  }

  useEffect(() => {
    if (selectProduct && open) {
      loadQuantities(selectProduct)
    }
  }, [selectProduct, open])

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeDialog("selectQuantity", null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectProduct?.name} - Select Quantity</DialogTitle>
        </DialogHeader>
        {isLoading && <div className="flex items-center justify-center w-full h-[120px]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>}
        <div className="grid grid-cols-3 gap-2">
          {!isLoading && quantities?.map((quantity) => (
            <div
              onClick={() => selectUnit(quantity)}
              key={quantity.id}
              className="grid relative border font-medium text-sm cursor-pointer hover:bg-accent min-h-[120px] items-end"
            >
              <div className="absolute inset-0 z-10">
                <img src={quantity.unit.preview_url || '/placeholder.svg'} className="w-full h-full" />
              </div>
              <div className="p-2 bg-muted/70 z-40 text-center hover:bg-accent/80">
                <div className="text-lg font-semibold">{quantity.unit.name} ({quantity.quantity})</div>
                <div className="text-sm font-medium">{formatCurrency(quantity.sale_price_without_tax)}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

