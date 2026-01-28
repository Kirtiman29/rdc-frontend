// src/api/orderApi.ts
import { orderApi } from './apiClient';
import type { OrderResponse } from '../types/product'; // ✅ FIXED: Now correctly exported

/**
 * Create a new order.
 * Backend logic: Fetches items from Cart Service (8091) then clears cart [cite: 1057-1063].
 * ✅ Matches: POST http://localhost:8095/api/orders
 */
export const createOrder = async (): Promise<OrderResponse> => {
  const response = await orderApi.post('');
  return response.data;
};

/**
 * Get details of a specific order by ID.
 * ✅ Matches: GET http://localhost:8095/api/orders/{orderId}
 */
export const getOrderDetails = async (orderId: number): Promise<OrderResponse> => {
  const response = await orderApi.get(`/${orderId}`);
  return response.data;
};

/**
 * Get order history for the authenticated user.
 * ✅ Matches: GET http://localhost:8095/api/orders
 */
export const getMyOrders = async (): Promise<OrderResponse[]> => {
  const response = await orderApi.get('');
  return response.data;
};

/**
 * Request a secure temporary download link for a paid order.
 * ✅ Matches: GET http://localhost:8095/api/orders/{orderId}/download [cite: 993-995]
 */
export const getOrderDownloadLink = async (orderId: number): Promise<{ downloadUrl: string }> => {
  const response = await orderApi.get(`/${orderId}/download`);
  return response.data;
};

export default orderApi;