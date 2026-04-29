export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "CANCELLED"
  | "SHIPPED"
  | "DELIVERED"
  | string;

export interface OrderItemResponse {
  id: number;
  designId: number;
  designIdentifier: string;
  assetUuid: string;
  designTitle: string;
  quantity: number;
  priceCents: number;
  totalPriceCents: number;
}

export interface OrderResponse {
  id: number;
  userId: number | string;
  status: OrderStatus;
  purchaseType?: string;
  createdAt: string;
  updatedAt?: string;
  grandTotalCents: number;
  customerName?: string;
  items: OrderItemResponse[];
}

export interface ApiDataEnvelope<T> {
  data: T;
}
