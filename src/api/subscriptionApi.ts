import { paymentApi, publicSubscriptionApi, subscriptionApi } from './apiClient';

export type PlanType = 'DESIGN' | 'AI' | 'COMBO';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | null;

export interface SubscriptionPlan {
  id: number;
  name: string;
  planType: PlanType;
  billingCycle: BillingCycle;
  price: number;
  pricePerDesign: number | null;
  designLimit: number;
  creditLimit: number;
}

export interface UserSubscriptionSummary {
  subscriptionId: number | null;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  planId: number | null;
  planName: string | null;
  planType: PlanType | null;
  billingCycle: BillingCycle | null;
  designLimit: number;
  creditLimit: number;
  availableCredits: number;
  usedDesigns: number;
  remainingDesigns: number;
  pricePerDesign: number | null;
}

export interface InitiateSubscriptionPaymentResponse {
  planId: number;
  planName: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  message: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  status: 'SUCCESS' | 'PAID' | 'FAILED' | string;
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void; backdropclose?: boolean };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

export const EMPTY_SUBSCRIPTION_SUMMARY: UserSubscriptionSummary = {
  subscriptionId: null,
  status: null,
  startDate: null,
  endDate: null,
  planId: null,
  planName: null,
  planType: null,
  billingCycle: null,
  designLimit: 0,
  creditLimit: 0,
  availableCredits: 0,
  usedDesigns: 0,
  remainingDesigns: 0,
  pricePerDesign: null,
};

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await publicSubscriptionApi.get<SubscriptionPlan[]>('/plans');
  return response.data;
};

export const getMySubscription = async (): Promise<UserSubscriptionSummary> => {
  return await subscriptionApi.get<UserSubscriptionSummary, UserSubscriptionSummary>('/me');
};

export const getMySubscriptionUsage = async (): Promise<UserSubscriptionSummary> => {
  return await subscriptionApi.get<UserSubscriptionSummary, UserSubscriptionSummary>('/me/usage');
};

export const getMyCredits = async (): Promise<number> => {
  return await subscriptionApi.get<number, number>('/me/credits');
};

export const initiateSubscriptionPayment = async (planId: number): Promise<InitiateSubscriptionPaymentResponse> => {
  return await subscriptionApi.post<InitiateSubscriptionPaymentResponse, InitiateSubscriptionPaymentResponse>(
    '/initiate-payment',
    { planId }
  );
};

export const verifySubscriptionPayment = async (
  response: RazorpaySuccessResponse
): Promise<PaymentVerificationResponse> => {
  return await paymentApi.post<PaymentVerificationResponse, PaymentVerificationResponse>('/verify', {
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature,
  });
};

export const hasActiveSubscription = (summary?: UserSubscriptionSummary | null) => {
  return summary?.status === 'ACTIVE';
};

export const getRemainingDesigns = (summary?: UserSubscriptionSummary | null) => {
  if (typeof summary?.remainingDesigns === 'number') {
    return Math.max(summary.remainingDesigns, 0);
  }

  return Math.max((summary?.designLimit ?? 0) - (summary?.usedDesigns ?? 0), 0);
};

export const canUseDesigns = (summary?: UserSubscriptionSummary | null) => {
  return (
    summary?.status === 'ACTIVE' &&
    Boolean(summary.planType && ['DESIGN', 'COMBO'].includes(summary.planType)) &&
    getRemainingDesigns(summary) > 0
  );
};

export const canUseAi = (summary?: UserSubscriptionSummary | null) => {
  return (
    summary?.status === 'ACTIVE' &&
    Boolean(summary.planType && ['AI', 'COMBO'].includes(summary.planType)) &&
    (summary.availableCredits ?? 0) > 0
  );
};

export const formatPlanPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatSubscriptionDate = (dateValue?: string | null) => {
  if (!dateValue) return 'No expiry';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue));
};

export const loadRazorpayScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Razorpay SDK failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.body.appendChild(script);
  });
};

export const openSubscriptionCheckout = async ({
  payment,
  onSuccess,
  onDismiss,
  onFailure,
}: {
  payment: InitiateSubscriptionPaymentResponse;
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
  onFailure?: (response: unknown) => void;
}) => {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }

  const checkout = new window.Razorpay({
    key: payment.key,
    amount: payment.amount,
    currency: payment.currency,
    name: 'RDC',
    description: payment.planName,
    order_id: payment.razorpayOrderId,
    handler: onSuccess,
    theme: { color: '#111111' },
    modal: {
      ondismiss: onDismiss,
      backdropclose: false,
    },
  });

  checkout.on('payment.failed', (response) => {
    onFailure?.(response);
  });

  checkout.open();
};
