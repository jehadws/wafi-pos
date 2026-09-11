/**
 * tests/integration/cart-item-quantity-stepper.test.tsx
 *
 * The cart's quantity stepper must always be visible. "Show Quantity"
 * (sb_subul_show_quantity) only controls whether the quantity selector is
 * shown while *adding* a product. With it off (quick-add mode) the stepper
 * pill in the cart is the only place a line's quantity can be seen and
 * corrected — hiding it made merged lines unreadable.
 */
import CartItem from '@/components/pos/cart-item';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const item = {
  id: 1,
  name: 'Cart Product',
  product_id: 1,
  unit_id: 3,
  unit_name: 'pcs',
  quantity: 1,
  unit_price: 10,
  price_without_tax: 10,
  price_with_tax: 10,
  total_price_without_tax: 10,
  total_price_with_tax: 10,
  discount: 0,
  discount_percentage: 0,
  mode: 'normal',
} as any;

const renderCartItem = (props: Partial<Parameters<typeof CartItem>[0]> = {}) =>
  render(
    <CartItem item={item} removeFromCart={vi.fn()} updateQuantity={vi.fn()} updatePrice={vi.fn()} updateDiscountPercentage={vi.fn()} {...props} />,
  );

describe('components/pos/cart-item quantity stepper visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePOS.getState().reset();
  });

  it('renders the stepper even when "Show Quantity" is off (quick-add mode)', () => {
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'no' } } as any);

    renderCartItem();

    expect(screen.getByTitle('Click to edit quantity').textContent).toBe('1');
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeTruthy();
  });

  it('still adjusts quantities from the stepper in quick-add mode', () => {
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'no' } } as any);

    const updateQuantity = vi.fn();
    renderCartItem({ updateQuantity });

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(updateQuantity).toHaveBeenCalledWith(item, 2);
  });

  it('decrements a quantity-2 line instead of removing it', () => {
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'no' } } as any);

    const updateQuantity = vi.fn();
    renderCartItem({ updateQuantity, item: { ...item, quantity: 2 } });

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(updateQuantity).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2 }), 1);
  });

  it('keeps the stepper in dialog mode ("Show Quantity" on)', () => {
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'yes' } } as any);

    renderCartItem();

    expect(screen.getByTitle('Click to edit quantity').textContent).toBe('1');
  });
});
