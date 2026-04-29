import { orderApi } from './apiClient';
import type { ApiDataEnvelope, OrderResponse } from '@/types/order';

export interface OrderItemRequest {
  designId: number;
  quantity: number;
  priceCents: number;
  designTitle?: string;
}

export interface CreateOrderRequest {
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  organizationName?: string;
  addressOne: string;
  addressTwo?: string;
  city: string;
  pincode: string;
  country?: string;
  billingState: string;
  customerGstin: string | null;
  totalPriceCents: number;
  items: OrderItemRequest[];
}

type OrderPayload = OrderResponse | ApiDataEnvelope<OrderResponse>;
type OrderListPayload = OrderResponse[] | ApiDataEnvelope<OrderResponse[]>;
type OrderDownloadPayload = { downloadUrl: string } | ApiDataEnvelope<{ downloadUrl: string }>;

const unwrapApiData = <T>(payload: T | ApiDataEnvelope<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload as T;
};

const normalizeOrder = (order: OrderResponse): OrderResponse => ({
  ...order,
  items: Array.isArray(order.items) ? order.items : [],
});

export const createOrder = async (orderPayload: CreateOrderRequest): Promise<OrderResponse> => {
  const response = await orderApi.post<OrderPayload, OrderPayload>('/', orderPayload);
  return normalizeOrder(unwrapApiData(response));
};

export const getOrderDetails = async (orderId: string | number): Promise<OrderResponse> => {
  const response = await orderApi.get<OrderPayload, OrderPayload>(`/${orderId}`);
  return normalizeOrder(unwrapApiData(response));
};

export const getMyOrders = async (): Promise<OrderResponse[]> => {
  const response = await orderApi.get<OrderListPayload, OrderListPayload>('/');
  return unwrapApiData(response).map(normalizeOrder);
};

export const getOrderDownloadLink = async (orderId: number): Promise<{ downloadUrl: string }> => {
  const response = await orderApi.get<OrderDownloadPayload, OrderDownloadPayload>(`/${orderId}/download`);
  return unwrapApiData(response);
};

export const downloadInvoicePdf = async (orderId: number) => {
  const file = await orderApi.get<Blob, Blob>(`/${orderId}/invoice`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
    },
  });

  const fileUrl = window.URL.createObjectURL(file);
  const fileLink = document.createElement('a');
  fileLink.href = fileUrl;
  fileLink.setAttribute('download', `Invoice-RDC-ORD${orderId}.pdf`);
  document.body.appendChild(fileLink);
  fileLink.click();
  fileLink.remove();
  window.URL.revokeObjectURL(fileUrl);
};

export default orderApi;
