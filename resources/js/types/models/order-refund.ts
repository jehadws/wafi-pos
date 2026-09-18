import type { Order } from './order';
import type { OrderProduct } from './order-product';

export interface OrderProductRefund {
  id?: number;
  author?: number;
  total_price: number;
  condition?: string;
  description?: string;
  updated_at?: string;
  created_at?: string;
  unit_id?: number;
  product_id?: number;
  order_product_id?: number;
  order_id?: number;
  order_refund_id?: number;
  quantity?: number;
  product?: Partial<OrderProduct> & { name?: string };
  unit?: { name?: string };
  orderProduct?: Partial<OrderProduct>;
}

export interface OrderRefund {
  id?: number;
  author?: number;
  shipping?: number;
  payment_method?: string;
  updated_at?: string;
  created_at?: string;
  order_id?: number;
  uuid?: string;
  order?: Partial<Order>;
  author_user?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  refunded_products?: OrderProductRefund[];
}
