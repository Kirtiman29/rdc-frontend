import { orderApi } from './apiClient';
import type { OrderResponse } from '../types/product'; 

export const createOrder = async (): Promise<OrderResponse> => {
  const response = await orderApi.post('');
  return response.data;
};

export const getOrderDetails = async (orderId: number): Promise<OrderResponse> => {
  const response = await orderApi.get(`/${orderId}`);
  return response.data;
};

export const getMyOrders = async (): Promise<OrderResponse[]> => {
  const response = await orderApi.get('');
  return response.data;
};

export const getOrderDownloadLink = async (orderId: number): Promise<{ downloadUrl: string }> => {
  const response = await orderApi.get(`/${orderId}/download`);
  return response.data;
};

// ✅ NEW: Functional Invoice Download
export const downloadInvoicePdf = async (orderId: number) => {
  try {
    const response = await orderApi.get(`/${orderId}/invoice`, {
      responseType: 'blob', // Essential for PDF files
    });
    
    // Create a temporary link to trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-RDC-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download invoice. Please try again.');
  }
};

export default orderApi;