export const ORDER_TYPE = {
  DELIVERY: 'delivery',
  TAKEAWAY: 'takeaway',
} as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIALLY: 'partially_paid',
  UNPAID: 'unpaid',
  HOLD: 'hold',
  VOID: 'order_void',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  DUE: 'due',
  PARTIALLY_DUE: 'partially_due',
  "NOT-AVAILABLE": 'not-available',
} as const;

export const PROCESSING_STATUS = {
  PENDING: 'pending',
  ONGOING: 'ongoing',
  READY: 'ready',
  FAILED: 'error',
  "NOT-AVAILABLE": 'not-available',
} as const;

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  ONGOING: 'ongoing',
  FAILED: 'error',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  "NOT-AVAILABLE": 'not-available',
} as const;

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Paid",
  partially_paid: "Partially Paid",
  unpaid: "Unpaid",
  hold: "On Hold",
  order_void: "Voided",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  due: "Due",
  partially_due: "Partially Due",
  "not-available": "Not Available",
};

export const DeliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending: "Pending",
  ongoing: "Ongoing",
  error: "Failed",
  completed: "Completed",
  delivered: "Delivered",
  "not-available": "Not Available",
};

export const ProcessingStatusLabels: Record<ProcessingStatus, string> = {
  pending: "Pending",
  ongoing: "Ongoing",
  ready: "Ready",
  error: "Failed",
  "not-available": "Not Available",
};

export const OrderTypeLabels: Record<OrderType, string> = {
  delivery: "Delivery",
  takeaway: "Takeaway",
};
