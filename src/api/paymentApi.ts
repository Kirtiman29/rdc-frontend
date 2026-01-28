// src/api/paymentApi.ts
// ✅ FIXED: Using authenticated instance to ensure Razorpay verification succeeds

import { paymentApi } from './apiClient'; 

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * [cite_start]Matches PaymentInitResponse record in Backend [cite: 1114-1115]
 */
export interface PaymentInitiateResponse {
  gatewayOrderId: string; // Razorpay order_id
  amountCents: number;    // Amount in Paise
  currency: string;       // Default "INR"
  razorpayKey: string;    // Public API Key
}

/**
 * Standard Razorpay callback payload
 */
export interface PaymentVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Matches Payment entity for history views
 */
export interface PaymentRecord {
  id: number;
  orderId: number;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amountCents: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * 1. Create a Razorpay Order
 * [cite_start]Backend: POST http://localhost:8092/api/payments/create [cite: 1111]
 */
export const initiatePayment = async (orderId: number): Promise<PaymentInitiateResponse> => {
  const response = await paymentApi.post<PaymentInitiateResponse>('/create', { orderId });
  return response.data;
};

/**
 * 2. Validate Razorpay Signature and Update Order Status
 * [cite_start]Backend: POST http://localhost:8092/api/payments/verify [cite: 1113]
 */
export const verifyPayment = async (data: PaymentVerifyRequest): Promise<{ status: string }> => {
  const response = await paymentApi.post('/verify', data);
  return response.data; // Returns { "status": "SUCCESS" }
};

/**
 * 3. Fetch Personal Payment History
 * [cite_start]Backend: GET http://localhost:8092/api/payments/my [cite: 1110]
 */
export const getMyPayments = async (): Promise<PaymentRecord[]> => {
  const response = await paymentApi.get<PaymentRecord[]>('/my');
  return response.data;
};

export default paymentApi;