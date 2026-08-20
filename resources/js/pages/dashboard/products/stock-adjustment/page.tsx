import AppLayout from '@/layouts/app-layout'
import React, { useState } from 'react'
import { procurementsApi, productsApi } from '@/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { usePage } from '@inertiajs/react'
import { useConfirmDialog } from '@/components/providers/confirm-dialog-provider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import SelectableItem from '@/components/ui/selectable-item'
import { useNumericKeypad } from '@/hooks/use-numeric-keypad'
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useTranslation } from '@/lib/i18n'

interface StockAdjustmentProduct extends Product {
  selected: boolean;
  adjust_unit: UnitQuantity | null;
  adjust_quantity: number
  adjust_action: string
  adjust_reason: string
  adjust_value: number
  available_quantity: number;
  procurement_product_id: number;
  procurement_history: {
    label: string,
    value: number
  }[]
}

export default function page() {
  const { actions } = usePage<{ actions: { value: string, label: string }[] }>().props;
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [products, setProducts] = useState<StockAdjustmentProduct[]>([])
  const confirm = useConfirmDialog()

  const { t } = useTranslation()

  const closeSearch = () => {
    setSuggestions([])
    setSearchQuery("")
  }

  const [selectingUnitFor, setSelectingUnitFor] = useState<string | null>(null);
  const [selectingActionFor, setSelectingActionFor] = useState<string | null>(null);
  const [selectingQuantityFor, setSelectingQuantityFor] = useState<string | null>(null);

  const handleQuantity = (quantity: string) => {
    if (selectingQuantityFor) {
      const product = products.find(product => `${product.id}-${product.adjust_unit?.unit?.id}` === selectingQuantityFor);
      if (product) {
        if (!['added', 'set'].includes(product.adjust_action)) {
          if (product.accurate_tracking !== undefined && +quantity > product.available_quantity) {
            return toast('The specified quantity exceed the available quantity.');
          } else if (product?.adjust_unit !== null && +quantity > product?.adjust_unit?.quantity) {
            return toast('The specified quantity exceed the available quantity.');
          }
        }
        product.adjust_quantity = Number(quantity);
        recalculateProduct(product);
      }
    }
    setSelectingQuantityFor(null);
  }

  const quantityKeypad = useNumericKeypad({
    onConfirm: handleQuantity,
    initialValue: "",
    title: "Define Quantity",
    maxLength: 6,
    allowDecimal: true,
  })

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const data = await procurementsApi.searchProcurementProduct(query)
      if (data.from === 'products') {
        if (data.products.length > 0) {
          setSuggestions(data.products)
        } else {
          closeSearch();
          return toast('Looks like no valid products matched the searched term.');
        }
      } else if (data.from === 'procurements') {
        if (data.product === null) {
          closeSearch();
          return toast('Looks like no valid products matched the searched term.');
        } else {
          addProductToList(data.product);
        }
      }
    } else {
      setSuggestions([])
    }
  }

  const addProductToList = (product: Product) => {
    const exists = products
      .filter(__product => __product.procurement_product_id === product.id);

    if (exists.length > 0) {
      closeSearch();
      return toast('The product already exists on the table.');
    }

    const action = actions.filter(action => action.value === 'deleted');
    const defaultAction = action.length === 1 ? action[0] : { value: 'deleted' };

    const finalProduct: StockAdjustmentProduct = {
      ...product,
      selected: false,
      // @ts-ignore
      id: product.product_id,
      // @ts-ignore
      unit_quantities: [product.unit],
      // @ts-ignore
      adjust_unit: product.unit_quantity,
      // @ts-ignore
      quantities: [product.unit_quantity],
      adjust_quantity: 1,
      adjust_action: defaultAction.value,
      adjust_reason: '',
      adjust_value: 0,
      accurate_tracking: true,
      procurement_product_id: product.id,
      procurement_history: [{
        // @ts-ignore
        label: `${product.procurement.name} (${product.available_quantity})`,
        value: product.id
      }]
    }

    recalculateProduct(finalProduct);
    setProducts(prev => [finalProduct, ...prev]);
    closeSearch();

  }

  const recalculateProduct = (product: StockAdjustmentProduct) => {
    if (product.adjust_unit !== null) {
      if (['deleted', 'defective', 'lost'].includes(product.adjust_action)) {
        product.adjust_value = - (product.adjust_quantity * product.adjust_unit.sale_price);
      } else {
        product.adjust_value = product.adjust_quantity * product.adjust_unit.sale_price;
      }
    }
    // this.$forceUpdate();
  }


  const addSuggestion = async (suggestion: Product) => {
    const alreadyAdded = products.filter(product => product.id === suggestion.id).length > 0;

    if (alreadyAdded) {
      closeSearch();
      return toast('The product already exists on the table.');
    }

    const data = await productsApi.getUnitQuantities(suggestion.id);
    if (data?.length > 0) {

      const defaultUnit = data?.filter(unitQuantity => unitQuantity.unit.base_unit);

      const action = actions.filter(action => action.value === 'set');
      const defaultAction = action.length === 1 ? action[0] : { value: 'set' };

      const modified: StockAdjustmentProduct = {
        ...suggestion,
        selected: true,
        adjust_quantity: 1,
        adjust_action: defaultAction.value,
        adjust_reason: '',
        adjust_unit: defaultUnit.length > 0 && !alreadyAdded ? defaultUnit[0] : null,
        adjust_value: 0,
        procurement_product_id: 0,
        procurement_history: [],
        available_quantity: 0,
      }



      recalculateProduct(modified);
      setProducts(prev => [modified, ...prev]);
      closeSearch();
    } else {
      return toast(`This product doesn't have any stock to adjust.`);
    }

    if (suggestion.accurate_tracking) {
      // suggestion.procurement_history      =   result[1].map( product => {
      //     return {
      //         label: `${product.procurement.name} (${product.available_quantity})`,
      //         value: product.id
      //     }
      // })
    }
  }
  const removeProduct = async (product: StockAdjustmentProduct) => {
    const ok = await confirm({
      title: "Confirm Your Action",
      message: "Would you like to remove this product from the table?",
      confirmText: "Remove",
      cancelText: "Cancel",
    })

    if (ok) {
      const index = products.indexOf(product);
      setProducts(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });
    }
  }
  const selectAdjustmentUnit = (product: StockAdjustmentProduct, unitQuantity: UnitQuantity) => {
    const index = products.indexOf(product);
    const otherProducts = products.filter((_, _index) => _index !== index);
    const exists = otherProducts
      .filter(__product => __product.adjust_unit !== null && __product.adjust_unit.unit.id === unitQuantity.unit.id && __product.adjust_unit.product_id === unitQuantity.product_id).length > 0;

    if (exists) {
      return toast('A similar product with the same unit already exists.');
    }

    product.adjust_unit = unitQuantity;
    recalculateProduct(product);
    setSelectingUnitFor(null);
  }


  const selectStockAdjustementAction = (product: StockAdjustmentProduct, action: string) => {
    const index = products.indexOf(product);
    if (index !== -1) {
      product.adjust_action = action;
      recalculateProduct(product);
    }
    setSelectingActionFor(null);
  }

  const handleUpdateQuantity = (product: StockAdjustmentProduct) => {
    quantityKeypad.openKeypad()
    setSelectingQuantityFor(`${product.id}-${product.adjust_unit?.unit?.id}`);
  }

  const proceedStockAdjustment = async () => {
    if (products.length === 0) {
      return toast('Unable to proceed as the table is empty.');
    }
    const ok = await confirm({
      title: "Confirm Your Action",
      message: "The stock adjustment is about to be made. Would you like to confirm ?",
      confirmText: "Proceed",
      cancelText: "Cancel",
    })

    if (ok) {
      try {
        const data = await productsApi.createAdjustment(products)
        toast(data.message);
        setProducts([]);
      } catch (error) {
        toast(error.message);
      }
    }

  }
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="relative">
          <h1 className="text-2xl font-semibold">{t("Stock Adjustment")}</h1>
          <p className="text-sm text-muted-foreground">{t("Adjust stock of existing products.")}</p>
        </div>

        <div>
          {/* Search Input */}
          <Command shouldFilter={false}>
            <CommandInput placeholder={"Search Products..."} value={searchQuery} onValueChange={(e) => handleSearch(e)} />
            <CommandList>
              <CommandGroup>
                {suggestions.map((product) => (
                  <CommandItem
                    key={product.id.toString()}
                    value={product.name}
                    onSelect={() => {
                      addSuggestion(product)
                    }}
                  >
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs">
                      {product.barcode}
                    </div>
                  </CommandItem>
                ))}

              </CommandGroup>
            </CommandList>
          </Command>
          <div>
            <Table className='border my-6'>
              <TableHeader>
                <TableRow className="">
                  <TableHead className="flex-1">{t("Product")}</TableHead>
                  <TableHead className="w-[140px] text-center">{t("Quantity")}</TableHead>
                  <TableHead className="text-center w-[140px]">{t("Value")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      {t("There is nothing to display...")}
                    </TableCell>
                  </TableRow>
                )}
                {products?.map((product) => (
                  <React.Fragment key={`${product.id}-${product.adjust_unit?.unit?.id}`}>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">
                        <div>
                          {product.name} ({(product.accurate_tracking ? product.available_quantity : product.adjust_unit!.quantity) || 0})
                        </div>
                        <div className="flex -mx-2 md:flex-row flex-wrap">
                          {/* Unit */}
                          <Dialog
                            open={selectingUnitFor === `${product.id}-${product.adjust_unit?.unit?.id}`}
                            onOpenChange={(isOpen) => setSelectingUnitFor(isOpen ? `${product.id}-${product.adjust_unit?.unit?.id}` : null)}
                            key={`${product.id}-${product.adjust_unit?.unit?.id}`}
                          >
                            <DialogTrigger asChild>
                              <div
                                className="px-2 w-1/2 md:w-auto"
                              >
                                <div className="text-xs cursor-pointer border-b border-dashed border-info-secondary py-1">
                                  <span className="text-xs">{t("Unit")}:</span>&nbsp;
                                  {product.adjust_unit?.unit ? (
                                    <span>{product.adjust_unit.unit.name}</span>
                                  ) : (
                                    <span>{t("N/A")}</span>
                                  )}
                                </div>
                              </div>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>{t("Select Unit")}</DialogTitle>
                                <DialogDescription>
                                  {t("Select the unit that you want to adjust the stock with.")}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2">
                                {product.unit_quantities.map((unit) => (
                                  <SelectableItem
                                    onChange={() => selectAdjustmentUnit(product, unit)}
                                    label={unit.unit.name}
                                    value={unit.id.toString()}
                                    key={unit.id}
                                    selected={product.adjust_unit!.id === unit.id}
                                  />
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Operation */}
                          <Dialog open={selectingActionFor === `${product.id}-${product.adjust_unit?.unit?.id}`}
                            onOpenChange={(isOpen) => setSelectingActionFor(isOpen ? `${product.id}-${product.adjust_unit?.unit?.id}` : null)}
                          >
                            <DialogTrigger asChild>
                              <div
                                className="px-2 w-1/2 md:w-auto"
                              >
                                <div className="text-xs cursor-pointer border-b border-dashed border-info-secondary py-1">
                                  <span className="text-xs">{t("Operation")}:</span>&nbsp;
                                  <span>{product.adjust_action}</span>
                                </div>
                              </div>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>{t("Select Action")}</DialogTitle>
                                <DialogDescription>
                                  {t("Select the action that you want to perform on the stock.")}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2">
                                {actions.map((action) => (
                                  <SelectableItem
                                    onChange={(val) => selectStockAdjustementAction(product, val)}
                                    label={action.label}
                                    value={action.value}
                                    key={action.value}
                                    selected={product.adjust_action === action.value}
                                  />
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Procurement (conditional) */}
                          {product.accurate_tracking && (
                            <div
                              className="px-2 w-1/2 md:w-auto"
                            // onClick={() => selectProcurement(product)}
                            >
                              <div className="text-xs cursor-pointer border-b border-dashed border-info-secondary py-1">
                                <span className="text-xs">{t("Procurement")}:</span>&nbsp;
                                <span>
                                  {
                                    product.procurement_history.find(
                                      (action) => action.value === product.procurement_product_id
                                    )?.label
                                  }
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Reason */}
                          <div
                            className="px-2 w-1/2 md:w-auto"
                          // onClick={() => provideReason(product)}
                          >
                            <div className="text-xs cursor-pointer border-b border-dashed border-info-secondary py-1">
                              <span className="text-xs">{t("Reason")}:</span>&nbsp;
                              {product.adjust_reason ? (
                                <span>{t("Provided")}</span>
                              ) : (
                                <span>{t("Not Provided")}</span>
                              )}
                            </div>
                          </div>

                          {/* Remove */}
                          <div
                            className="px-2 w-1/2 md:w-auto"
                            onClick={() => removeProduct(product)}
                          >
                            <div className="text-xs cursor-pointer border-b border-dashed border-danger-secondary py-1">
                              <span className="text-xs">{t("Remove")}</span>
                            </div>
                          </div>
                        </div>

                      </TableCell>
                      <TableCell className="text-center font-medium w-[140px]" onClick={() => handleUpdateQuantity(product)}>
                        <div className="cursor-pointer border-b border-dashed pb-1 border-info-secondary">
                          {product.adjust_quantity}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium w-[140px]">{product.adjust_value}</TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="w-full flex justify-end">
            <Button
              onClick={proceedStockAdjustment}
            >
              {t("Proceed")}
            </Button>
          </div>
        </div>

        <NumericKeypadDialog {...quantityKeypad.keypadProps} />

      </div>
    </AppLayout>
  )
}
