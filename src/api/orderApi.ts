import { orderApi } from './apiClient';
import axios from 'axios';
import type { OrderResponse } from '../types/product'; 

/**
 * ✅ Create a new order from current cart
 * Service: VITE_ORDER_SERVICE_URL
 */
export const createOrder = async (): Promise<OrderResponse> => {
  return await orderApi.post('');
};

export const getOrderDetails = async (orderId: number): Promise<OrderResponse> => {
  return await orderApi.get(`/${orderId}`);
};

export const getMyOrders = async (): Promise<OrderResponse[]> => {
  return await orderApi.get('');
};

export const getOrderDownloadLink = async (orderId: number): Promise<{ downloadUrl: string }> => {
  return await orderApi.get(`/${orderId}/download`);
};

/**
 * ✅ PDF Invoice Download
 * Logic: We bypass the unwrapped instance for Blobs to prevent data corruption.
 */
export const downloadInvoicePdf = async (orderId: number) => {
  try {
    const token = localStorage.getItem('accessToken');
    const ORDER_URL = import.meta.env.VITE_ORDER_SERVICE_URL;

    // We use a raw axios call here because our interceptor is optimized for JSON/Data unwrapping.
    // For binary Blobs, we need the full response object.
    const response = await axios.get(`${ORDER_URL}/api/orders/${orderId}/invoice`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const file = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = window.URL.createObjectURL(file);
    
    const fileLink = document.createElement('a');
    fileLink.href = fileURL;
    fileLink.setAttribute('download', `Invoice-RDC-${orderId}.pdf`);
    document.body.appendChild(fileLink);
    fileLink.click();
    
    fileLink.remove();
    window.URL.revokeObjectURL(fileURL);
  } catch (error) {
    console.error('❌ Download failed:', error);
    alert('Invoice generation failed. Please try again later.');
  }
};

export default orderApi;