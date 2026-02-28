import { orderApi } from './apiClient';
import axios from 'axios';
import type { OrderResponse } from '../types/product'; 

/**
 * ✅ Create a new order from current cart
 * Hits: POST https://ruchitadesigncompany.in/api/orders
 * * Note: Your apiClient interceptor already unwraps 'response.data'.
 * If your Java backend returns a wrapper like { status: 200, data: {...} },
 * you might need to return 'res.data' here.
 */
export const createOrder = async (): Promise<OrderResponse> => {
    // Hits the base URL of the instance directly
    const response: any = await orderApi.post('');
    return response;
};

/**
 * ✅ Get details for a specific order
 * Hits: GET https://ruchitadesigncompany.in/api/orders/{orderId}
 */
export const getOrderDetails = async (orderId: number): Promise<OrderResponse> => {
    return await orderApi.get(`/${orderId}`);
};

/**
 * ✅ Fetch user's order history
 * Hits: GET https://ruchitadesigncompany.in/api/orders
 */
export const getMyOrders = async (): Promise<OrderResponse[]> => {
    return await orderApi.get('');
};

/**
 * ✅ Get download link for assets in an order
 * Hits: GET https://ruchitadesigncompany.in/api/orders/{orderId}/download
 */
export const getOrderDownloadLink = async (orderId: number): Promise<{ downloadUrl: string }> => {
    return await orderApi.get(`/${orderId}/download`);
};

/**
 * ✅ PDF Invoice Download
 * Logic: Uses standard axios to handle binary blob data
 */
export const downloadInvoicePdf = async (orderId: number) => {
    try {
        const token = localStorage.getItem('accessToken');
        // Fallback to the same base URL if VITE_ORDER_SERVICE_URL isn't set
        const ORDER_URL = import.meta.env.VITE_ORDER_SERVICE_URL || import.meta.env.VITE_ADMIN_SERVICE_URL;

        const response = await axios.get(`${ORDER_URL}/api/orders/${orderId}/invoice`, {
            responseType: 'blob',
            headers: { 
                Authorization: `Bearer ${token}`,
                'Accept': 'application/pdf'
            }
        });
        
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = window.URL.createObjectURL(file);
        
        const fileLink = document.createElement('a');
        fileLink.href = fileURL;
        fileLink.setAttribute('download', `Invoice-RDC-${orderId}.pdf`);
        document.body.appendChild(fileLink);
        fileLink.click();
        
        // Cleanup
        fileLink.remove();
        window.URL.revokeObjectURL(fileURL);
    } catch (error) {
        console.error('❌ Download failed:', error);
        alert('Invoice generation failed. Please try again later.');
    }
};

export default orderApi;