// src/api/orderApi.ts
import { orderApi } from './apiClient';
import axios from 'axios';
import type { OrderResponse } from '../types/product'; 

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
    
    // New Billing Fields
    organizationName?: string;
    addressOne: string;
    addressTwo?: string;
    city: string;
    pincode: string;
    country?: string; // Default 'India' usually handled by backend
    
    billingState: string;
    customerGstin: string | null;
    totalPriceCents: number;
    items: OrderItemRequest[];
}

/**
 * ✅ Creates a new order with full billing/GST details
 */
export const createOrder = async (orderPayload: CreateOrderRequest): Promise<any> => {
    // Note: orderApi (apiClient) handles the base /api/orders path
    return await orderApi.post('', orderPayload);
};

export const getOrderDetails = async (orderId: string | number): Promise<OrderResponse> => {
    return await orderApi.get(`/${orderId}`);
};

export const getMyOrders = async (): Promise<OrderResponse[]> => {
    return await orderApi.get('');
};

export const getOrderDownloadLink = async (orderId: number): Promise<{ downloadUrl: string }> => {
    return await orderApi.get(`/${orderId}/download`);
};

/**
 * ✅ Logic to fetch and download the Generated GST Invoice PDF
 */
export const downloadInvoicePdf = async (orderId: number) => {
    try {
        const token = localStorage.getItem('accessToken');
        // Use the baseURL from the instance to stay consistent with production/dev environments
        const baseUrl = orderApi.defaults.baseURL;

        const response = await axios.get(`${baseUrl}/${orderId}/invoice`, {
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
        fileLink.setAttribute('download', `Invoice-RDC-ORD${orderId}.pdf`);
        document.body.appendChild(fileLink);
        fileLink.click();
        
        // Cleanup
        fileLink.remove();
        window.URL.revokeObjectURL(fileURL);
    } catch (error) {
        console.error('❌ Download failed:', error);
        alert('Invoice generation failed or not yet available.');
    }
};

export default orderApi;