import type { Order } from './order';

export interface OrderPayment {
  id?: number;
  order_id?: number;
  value: number;
  author?: number;
  identifier: string;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  label?: string;
  payment_label?: string;
  order?: Partial<Order>;
}
