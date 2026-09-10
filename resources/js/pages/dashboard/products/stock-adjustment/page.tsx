import AppLayout from '@/layouts/app-layout'
import React, { useState } from 'react'
import { procurementsApi, productsApi } from '@/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { usePage } from '@inertiajs/react'
import { useConfirmDialog } from '@/components/providers/confirm-dialog-provider'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import SelectableItem from '@/components/ui/selectable-item'
import { useNumericKeypad } from '@/hooks/use-numeric-keypad'
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useTranslation } from '@/lib/i18n'
import { Textarea } from '@/components/ui/textarea'

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

export default function Page() {
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
  const [reasonDialogFor, setReasonDialogFor] = useState<string | null>(null);
  const [pendingReason, setPendingReason] = useState<string>('');

  /**
   * Pure helper: returns a new product copy with adjust_value recomputed.
   * Does not mutate the original product object.
   */
  const recalculateProduct = (product: StockAdjustmentProduct): StockAdjustmentProduct => {
    if (product.adjust_unit === null) return product;
    const adjust_value = ['deleted', 'defective', 'lost'].includes(product.adjust_action)
      ? -(product.adjust_quantity * product.adjust_unit.sale_price)
      : product.adjust_quantity * product.adjust_unit.sale_price;
    return { ...product, adjust_value };
  };

  const handleQuantity = (quantity: string) => {
    if (selectingQuantityFor) {
      setProducts(prev => prev.map(product => {
        if (`${product.id}-${product.adjust_unit?.unit?.id}` !== selectingQuantityFor) return product;

        if (!['added', 'set'].includes(product.adjust_action)) {
          // Use accurate_tracking to decide which stock ceiling applies.
          // For procurement-tracked products use the batch available_quantity;
          // for regular products use the unit quantity on hand.
          const maxQty = product.accurate_tracking
            ? product.available_quantity
            : (product.adjust_unit?.quantity ?? Infinity);

          if (+quantity > maxQty) {
            toast(t('The specified quantity exceed the available quantity.'));
            return product;
          }
        }

        return recalculateProduct({ ...product, adjust_quantity: Number(quantity) });
      }));
    }
    setSelectingQuantityFor(null);
  }

  const quantityKeypad = useNumericKeypad({
    onConfirm: handleQuantity,
    initialValue: "",
    title: t("Define Quantity"),
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
          return toast(t('Looks like no valid products matched the searched term.'));
        }
      } else if (data.from === 'procurements') {
        if (data.product === null) {
          closeSearch();
          return toast(t('Looks like no valid products matched the searched term.'));
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
      return toast(t('The product already exists on the table.'));
    }

    const action = actions.filter(action => action.value === 'deleted');
    const defaultAction = action.length === 1 ? action[0] : { value: 'deleted' };

    const finalProduct: StockAdjustmentProduct = {
      ...product,
      selected: false,
      // @ts-expect-error Inertia form type
      id: product.product_id,
      // @ts-expect-error Inertia form type - use the full UnitQuantity object (not the bare Unit)
      // so the unit-selector dialog compares UnitQuantity ids consistently.
      unit_quantities: [product.unit_quantity],
      // @ts-expect-error Inertia form type
      adjust_unit: product.unit_quantity,
      // @ts-expect-error Inertia form type
      quantities: [product.unit_quantity],
      adjust_quantity: 1,
      adjust_action: defaultAction.value,
      adjust_reason: '',
      adjust_value: 0,
      accurate_tracking: true,
      procurement_product_id: product.id,
      procurement_history: [{
        // @ts-expect-error Inertia form type
        label: `${product.procurement.name} (${product.available_quantity})`,
        value: product.id
      }]
    }

    setProducts(prev => [recalculateProduct(finalProduct), ...prev]);
    closeSearch();

  }

  const addSuggestion = async (suggestion: Product) => {
    // Guard against both search-branch duplicates (by product id) and
    // procurement-branch duplicates (by procurement_product_id carrying the same product).
    const alreadyAdded = products.some(
      p => p.id === suggestion.id || p.procurement_product_id === suggestion.id
    );

    if (alreadyAdded) {
      closeSearch();
      return toast(t('The product already exists on the table.'));
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
        // Fall back to the first available unit when no base unit is configured (avoids null adjust_unit).
        adjust_unit: defaultUnit.length > 0 ? defaultUnit[0] : data[0],
        adjust_value: 0,
        procurement_product_id: 0,
        procurement_history: [],
        available_quantity: 0,
      }

      setProducts(prev => [recalculateProduct(modified), ...prev]);
      closeSearch();
    } else {
      return toast(t("This product doesn't have any stock to adjust."));
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
      title: t("Confirm Your Action"),
      message: t("Would you like to remove this product from the table?"),
      confirmText: t("Remove"),
      cancelText: t("Cancel"),
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
      return toast(t('A similar product with the same unit already exists.'));
    }

    setProducts(prev => prev.map(p => {
      if (p !== product) return p;
      return recalculateProduct({ ...p, adjust_unit: unitQuantity });
    }));
    setSelectingUnitFor(null);
  }


  const selectStockAdjustementAction = (product: StockAdjustmentProduct, action: string) => {
    setProducts(prev => prev.map(p => {
      if (p !== product) return p;
      return recalculateProduct({ ...p, adjust_action: action });
    }));
    setSelectingActionFor(null);
  }

  const handleUpdateQuantity = (product: StockAdjustmentProduct) => {
    quantityKeypad.openKeypad()
    setSelectingQuantityFor(`${product.id}-${product.adjust_unit?.unit?.id}`);
  }

  const openReasonDialog = (product: StockAdjustmentProduct) => {
    setReasonDialogFor(`${product.id}-${product.adjust_unit?.unit?.id}`);
    setPendingReason(product.adjust_reason);
  }

  const saveReason = () => {
    if (!reasonDialogFor) return;
    setProducts(prev => prev.map(p => {
      if (`${p.id}-${p.adjust_unit?.unit?.id}` !== reasonDialogFor) return p;
      return { ...p, adjust_reason: pendingReason };
    }));
    setReasonDialogFor(null);
    setPendingReason('');
  }

  const proceedStockAdjustment = async () => {
    if (products.length === 0) {
      return toast(t('Unable to proceed as the table is empty.'));
    }

    const missingUnit = products.find(p => p.adjust_unit === null);
    if (missingUnit) {
      return toast(t('Please select a unit for all products before proceeding.'));
    }

    const ok = await confirm({
      title: t("Confirm Your Action"),
      message: t("The stock adjustment is about to be made. Would you like to confirm ?"),
      confirmText: t("Proceed"),
      cancelText: t("Cancel"),
    })

    if (ok) {
      try {
        const data = await productsApi.createAdjustment(products)
        toast(data.message);
        setProducts([]);
      } catch (error: any) {
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
            <CommandInput placeholder={t("Search Products...")} value={searchQuery} onValueChange={(e) => handleSearch(e)} />
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
                          {product.name} ({(product.accurate_tracking ? product.available_quantity : (product.adjust_unit?.quantity ?? 0)) || 0})
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
                                    selected={product.adjust_unit?.id === unit.id}
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
                            onClick={() => openReasonDialog(product)}
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

        {/* Reason dialog — shared across all product rows, controlled by reasonDialogFor key */}
        <Dialog open={reasonDialogFor !== null} onOpenChange={(isOpen) => { if (!isOpen) setReasonDialogFor(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("Adjustment Reason")}</DialogTitle>
              <DialogDescription>
                {t("Useful to describe better what are the reasons behind this stock adjustment.")}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={pendingReason}
              onChange={(e) => setPendingReason(e.target.value)}
              placeholder={t("Enter reason...")}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setReasonDialogFor(null)}>{t("Cancel")}</Button>
              <Button onClick={saveReason}>{t("Save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  )
}
