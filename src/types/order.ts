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
  createdAt?: string;
  updatedAt?: string;
  grandTotalCents: number;
  subTotalCents?: number | null;
  subtotalAmountCents?: number | null;
  discountAmountCents?: number | null;
  finalAmountCents?: number | null;
  couponCode?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  billingState?: string;
  city?: string;
  addressOne?: string;
  addressTwo?: string;
  pincode?: string;
  organizationName?: string;
  customerGstin?: string | null;
  items: OrderItemResponse[];
}

export interface ApiDataEnvelope<T> {
  data: T;
}
