
import { create } from 'zustand';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import * as math from 'mathjs';

interface CartState {
  products: CartProduct[];
  selectedProducts: string[];
}

interface CartActions {
  addProduct: (productData: Omit<CartProduct, '_uuid' | 'total_price' | 'total_price_with_tax' | 'total_price_without_tax' | 'total_tax_value' | 'discount'>, autoMarge?: boolean) => void;
  removeProduct: (uuid: string) => void;
  updateProductQuantity: (uuid: string, newQuantity: number) => void;
  updateProductUnitPrice: (uuid: string, newUnitPrice: number) => void;
  updateProductDiscount: (uuid: string, newDiscountPercentage: number) => void;
  clearCart: () => void;
  getProductById: (uuid: string) => CartProduct | undefined;
  toggleProductSelection: (uuid: string) => void;
  selectAllProducts: () => void;
  deselectAllProducts: () => void;
  removeSelectedProducts: () => void;
}

// --- Helper Functions ---
const computeProduct = (product: CartProduct): CartProduct => {
  const computed = { ...product };

  // 1. Calculate Discount
  if (computed.discount_type === 'percentage') {
    const lineSubtotal = math.chain(computed.unit_price).multiply(computed.quantity).done();
    computed.discount = math.chain(lineSubtotal)
      .multiply(computed.discount_percentage)
      .divide(100)
      .done();
  }

  // 2. Calculate Totals (pre-tax)
  const totalBeforeTax = math.chain(computed.unit_price)
    .multiply(computed.quantity)
    .subtract(computed.discount)
    .done();

  // 3. Calculate Taxes
  let taxRate = 0;
  if (computed.price_without_tax > 0) {
    taxRate = math.chain(computed.tax_value).divide(computed.price_without_tax).done();
  }

  if (computed.tax_type === 'exclusive') {
    computed.total_tax_value = math.chain(totalBeforeTax).multiply(taxRate).done();
  } else if (computed.tax_type === 'inclusive') {
    const taxMultiplier = math.chain(1).add(taxRate).done();
    const priceWithTax = totalBeforeTax;
    const priceWithoutTax = math.chain(priceWithTax).divide(taxMultiplier).done();
    computed.total_tax_value = math.chain(priceWithTax).subtract(priceWithoutTax).done();
  } else {
    computed.total_tax_value = 0;
  }

  // 4. Calculate Final Totals
  computed.total_price_without_tax = totalBeforeTax;
  computed.total_price_with_tax = math.chain(totalBeforeTax).add(computed.total_tax_value).done();
  computed.total_price = computed.total_price_with_tax;

  return computed;
};

// --- Zustand Store ---
export const useCartStore = create<CartState & CartActions>((set, get) => ({
  products: [],
  selectedProducts: [],

  addProduct: (productData, autoMarge = false) => {
    const { products } = get();
    let newProducts = [...products];

    if (autoMarge) {
      const existingIndex = products.findIndex(p =>
        p.product_id === productData.product_id &&
        p.unit_quantity_id === productData.unit_quantity_id
      );

      if (existingIndex !== -1) {
        const existingProduct = products[existingIndex];
        const newQuantity = existingProduct.quantity + productData.quantity;
        const updatedProduct = { ...existingProduct, quantity: newQuantity };
        newProducts[existingIndex] = computeProduct(updatedProduct);
      } else {
        const newProduct = computeProduct({ ...productData, _uuid: uuidv4(), discount: 0, total_price: 0, total_price_with_tax: 0, total_price_without_tax: 0, total_tax_value: 0 });
        newProducts = [newProduct, ...newProducts];
      }
    } else {
      const newProduct = computeProduct({ ...productData, _uuid: uuidv4(), discount: 0, total_price: 0, total_price_with_tax: 0, total_price_without_tax: 0, total_tax_value: 0 });
      newProducts = [newProduct, ...newProducts];
    }
    set({ products: newProducts });
  },

  removeProduct: (uuid) => {
    set(state => ({
      products: state.products.filter(p => p._uuid !== uuid),
      selectedProducts: state.selectedProducts.filter(id => id !== uuid),
    }));
  },

  updateProduct: (uuid, updates) => {
    set(state => ({
      products: state.products.map(p => {
        if (p._uuid === uuid) {
          return computeProduct({ ...p, ...updates });
        }
        return p;
      })
    }));
  },

  updateProductQuantity: (uuid, newQuantity) => {
    if (newQuantity <= 0) {
      get().removeProduct(uuid);
    } else {
      get().updateProduct(uuid, { quantity: newQuantity });
    }
  },

  updateProductUnitPrice: (uuid, newUnitPrice) => {
    get().updateProduct(uuid, { unit_price: newUnitPrice });
  },

  updateProductDiscount: (uuid, newDiscountPercentage) => {
    get().updateProduct(uuid, { discount_percentage: newDiscountPercentage });
  },

  clearCart: () => {
    if (get().products.length > 0) {
      set({ products: [], selectedProducts: [] });
      toast.info('Cart cleared', {
        description: 'All items have been removed from the cart',
      });
    }
  },

  getProductById: (uuid) => {
    return get().products.find(p => p._uuid === uuid);
  },

  toggleProductSelection: (uuid) => {
    set(state => ({
      selectedProducts: state.selectedProducts.includes(uuid)
        ? state.selectedProducts.filter(id => id !== uuid)
        : [...state.selectedProducts, uuid],
    }));
  },

  selectAllProducts: () => {
    set(state => ({ selectedProducts: state.products.map(p => p._uuid) }));
  },

  deselectAllProducts: () => {
    set({ selectedProducts: [] });
  },

  removeSelectedProducts: () => {
    const { selectedProducts } = get();
    if (selectedProducts.length === 0) return;

    set(state => ({
      products: state.products.filter(p => !selectedProducts.includes(p._uuid)),
      selectedProducts: [],
    }));

    toast.success(
      `Removed ${selectedProducts.length} item${selectedProducts.length > 1 ? 's' : ''}`,
      {
        description: 'Selected items have been removed from the cart',
      }
    );
  },
}));

/**
 * Note on derived state (subtotal, totalTax):
 * With Zustand, it's often more performant to calculate derived state inside the component
 * using selectors. This ensures components only re-render when the specific value they need changes.
 *
 * Example in your component:
 * const subtotal = useCartStore(state =>
 *   state.products.reduce((acc, p) => acc + p.total_price_without_tax, 0)
 * );
 */
