import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createOrder,
  getBestAutoApplyCoupon,
  validateUserCoupon,
  type CouponDiscountType,
  type CreateOrderRequest,
} from '@/api/orderApi';
import { processIndustrialPayment } from '@/api/paymentApi';
import {
  formatPlanPrice,
  getPlans,
  initiateSubscriptionPayment,
  openSubscriptionCheckout,
  verifySubscriptionPayment,
  type SubscriptionPlan,
} from '@/api/subscriptionApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatPrice } from '@/utils/price';
import {
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { getAssetUrl, getToken } from '@/api/apiClient';

export const GST_STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10",
  "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24", "Haryana": "06",
  "Himachal Pradesh": "02", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32",
  "Madhya Pradesh": "23", "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
  "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Punjab": "03",
  "Rajasthan": "08", "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36",
  "Tripura": "16", "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19",
  "Andaman and Nicobar Islands": "35", "Chandigarh": "04",
  "Dadra and Nagar Haveli and Daman and Diu": "26", "Delhi": "07",
  "Jammu and Kashmir": "01", "Ladakh": "38", "Lakshadweep": "31", "Puducherry": "34"
};

type CheckoutStep = 'review' | 'details';
type CouponSource = 'auto' | 'manual';

interface AppliedCoupon {
  couponCode: string;
  discountType: CouponDiscountType | null;
  discountValue: number | null;
  discountAmountCents: number;
  finalAmountCents: number;
  source: CouponSource;
}

const ORDER_COUPON_SCOPE = 'ORDER' as const;

const amountToCents = (amount?: number | null) => {
  if (amount === undefined || amount === null) return null;
  return Math.round(amount * 100);
};

const amountFromCents = (cents: number) => Number((cents / 100).toFixed(2));

const buildAppliedCoupon = (
  grandTotal: number,
  source: CouponSource,
  response: {
    valid: boolean;
    couponCode: string | null;
    discountType: CouponDiscountType | null;
    discountValue: number | null;
    discountAmount: number | null;
    finalAmount: number | null;
  }
): AppliedCoupon | null => {
  if (!response.valid || !response.couponCode) return null;

  const discountAmountCents = Math.max(0, amountToCents(response.discountAmount) ?? 0);
  const finalAmountCents = Math.max(
    0,
    amountToCents(response.finalAmount) ?? Math.max(grandTotal - discountAmountCents, 0)
  );

  return {
    couponCode: response.couponCode,
    discountType: response.discountType,
    discountValue: response.discountValue,
    discountAmountCents,
    finalAmountCents,
    source,
  };
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items } = useCart();

  const cart = items || [];
  const subscriptionPlanId = Number(searchParams.get('planId'));
  const isSubscriptionCheckout = Number.isFinite(subscriptionPlanId) && subscriptionPlanId > 0;

  const [step, setStep] = useState<CheckoutStep>('review');
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingSubscriptionPlan, setIsLoadingSubscriptionPlan] = useState(false);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [addressOne, setAddressOne] = useState('');
  const [addressTwo, setAddressTwo] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [billingState, setBillingState] = useState('');
  const [hasGstin, setHasGstin] = useState(false);
  const [customerGstin, setCustomerGstin] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [hasDismissedAutoCoupon, setHasDismissedAutoCoupon] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpeningGateway, setIsOpeningGateway] = useState(false);
  const [isVerifyingSuccess, setIsVerifyingSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedSubscriptionPlan = useMemo(
    () => subscriptionPlans.find((plan) => plan.id === subscriptionPlanId) || null,
    [subscriptionPlanId, subscriptionPlans]
  );

  const grandTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0),
    [cart]
  );

  const taxableSubtotal = useMemo(
    () => Math.floor(grandTotal / 1.18),
    [grandTotal]
  );

  const gstAmount = useMemo(
    () => grandTotal - taxableSubtotal,
    [grandTotal, taxableSubtotal]
  );

  const couponAmount = useMemo(
    () => amountFromCents(grandTotal),
    [grandTotal]
  );

  const discountAmountCents = appliedCoupon?.discountAmountCents ?? 0;
  const finalPayableCents = appliedCoupon?.finalAmountCents ?? grandTotal;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyCouponCode = async (code: string, source: CouponSource) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedCoupon(null);
      setCouponFeedback("Enter a coupon code.");
      return false;
    }

    if (!getToken()) {
      setAppliedCoupon(null);
      setCouponFeedback("Please login to use coupons.");
      return false;
    }

    setIsApplyingCoupon(true);

    try {
      const response = await validateUserCoupon({
        code: normalizedCode,
        amount: couponAmount,
        scope: ORDER_COUPON_SCOPE,
      });

      const nextCoupon = buildAppliedCoupon(grandTotal, source, response);
      setCouponFeedback(response.message);

      if (!nextCoupon) {
        setAppliedCoupon(null);
        return false;
      }

      setAppliedCoupon(nextCoupon);
      setCouponInput(nextCoupon.couponCode);
      return true;
    } catch (error: any) {
      setAppliedCoupon(null);
      setCouponFeedback(
        error?.response?.data?.message || error?.message || "Coupon could not be validated."
      );
      return false;
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const autoApplyCoupon = async () => {
    if (!getToken() || hasDismissedAutoCoupon || couponAmount <= 0) return;

    setIsApplyingCoupon(true);

    try {
      const response = await getBestAutoApplyCoupon({
        amount: couponAmount,
        scope: ORDER_COUPON_SCOPE,
      });

      const nextCoupon = buildAppliedCoupon(grandTotal, 'auto', response);

      if (!nextCoupon || response.available === false) {
        setAppliedCoupon(null);
        setCouponFeedback(null);
        return;
      }

      setAppliedCoupon(nextCoupon);
      setCouponInput(nextCoupon.couponCode);
      setCouponFeedback(response.message);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponFeedback(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    setHasDismissedAutoCoupon(false);
    await applyCouponCode(couponInput, 'manual');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponFeedback("Coupon removed.");
    setHasDismissedAutoCoupon(true);
  };

  const handleSubscriptionPayment = async () => {
    if (isLoadingSubscriptionPlan) return;
    if (!selectedSubscriptionPlan) return handleError("Subscription plan was not found.");
    if (isProcessing || isOpeningGateway) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const payment = await initiateSubscriptionPayment(selectedSubscriptionPlan.id);

      await openSubscriptionCheckout({
        payment,
        onSuccess: async (response) => {
          try {
            setIsVerifyingSuccess(true);
            const verification = await verifySubscriptionPayment(response);

            if (verification.status !== 'SUCCESS' && verification.status !== 'PAID') {
              throw new Error('Payment verification failed');
            }

            navigate('/profile');
          } catch (error: any) {
            setIsVerifyingSuccess(false);
            setIsOpeningGateway(false);
            setIsProcessing(false);
            handleError(error?.response?.data?.message || error?.message || "Payment verification failed.");
          }
        },
        onDismiss: () => {
          setIsOpeningGateway(false);
          setIsProcessing(false);
        },
        onFailure: () => {
          setIsOpeningGateway(false);
          setIsProcessing(false);
          handleError("Razorpay could not complete the payment. Please try again.");
        },
      });

      setIsOpeningGateway(true);
      setIsProcessing(false);
    } catch (error: any) {
      setIsProcessing(false);
      setIsOpeningGateway(false);
      handleError(error?.response?.data?.message || error?.message || "Subscription payment could not be started.");
    }
  };

  const handleCheckout = async () => {
    if (isSubscriptionCheckout) {
      await handleSubscriptionPayment();
      return;
    }

    if (cart.length === 0) return handleError("Your cart is empty.");
    if (isProcessing || isOpeningGateway) return;

    if (step === 'review') {
      setStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!customerName.trim()) return handleError("Full name is required.");
    if (!customerEmail.trim()) return handleError("Email address is required.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) return handleError("Please enter a valid email address.");

    if (!customerPhone || customerPhone.length !== 10) return handleError("Phone number must be 10 digits.");
    if (!addressOne.trim()) return handleError("Street address is required.");
    if (!city.trim()) return handleError("City is required.");
    if (!pincode || pincode.length !== 6) return handleError("Pincode must be 6 digits.");
    if (!billingState) return handleError("Please select your state.");

    if (hasGstin) {
      const gstRegex = /^[0-9]{2}[A-Z0-9]{13}$/;
      if (!gstRegex.test(customerGstin)) return handleError("Invalid GSTIN format.");
    }

    const pendingCoupon = couponInput.trim().toUpperCase();
    if (pendingCoupon && pendingCoupon !== appliedCoupon?.couponCode) {
      const wasApplied = await applyCouponCode(pendingCoupon, 'manual');
      if (!wasApplied) return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (!Number.isFinite(Number(user?.id))) {
        throw new Error("Your session is missing a valid user ID. Please sign in again.");
      }

      const orderPayload: CreateOrderRequest = {
        userId: Number(user?.id),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        organizationName: organizationName.trim(),
        addressOne: addressOne.trim(),
        addressTwo: addressTwo.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        billingState: billingState.trim(),
        customerGstin: hasGstin ? customerGstin.toUpperCase() : '',
        couponCode: appliedCoupon?.couponCode,
      };

      const createdOrder = await createOrder(orderPayload);
      const actualOrderId = Number(createdOrder.id);

      if (!Number.isFinite(actualOrderId) || actualOrderId <= 0) {
        throw new Error("Order was created but no valid order ID was returned.");
      }

      try {
        await processIndustrialPayment(actualOrderId, navigate, {
          name: customerName,
          email: customerEmail,
          onPaymentStart: () => {
            setIsOpeningGateway(true);
            setIsProcessing(false);
          },
          onPaymentSuccess: () => {
            setIsVerifyingSuccess(true);
          }
        });
      } catch (error) {
        setIsOpeningGateway(false);
        setIsProcessing(false);
        handleError("Payment gateway failed to load.");
      }
    } catch (error: any) {
      setIsProcessing(false);
      setIsOpeningGateway(false);
      handleError(error?.response?.data?.message || error?.message || "Transaction aborted.");
    }
  };

  useEffect(() => {
    loadRazorpay();
  }, []);

  useEffect(() => {
    setCustomerName(user?.name || '');
    setCustomerEmail(user?.email || '');
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!isSubscriptionCheckout) return;

    const loadSubscriptionPlan = async () => {
      setIsLoadingSubscriptionPlan(true);
      try {
        const response = await getPlans();
        setSubscriptionPlans(response);
      } catch (error: any) {
        handleError(error?.response?.data?.message || "Subscription plan could not be loaded.");
      } finally {
        setIsLoadingSubscriptionPlan(false);
      }
    };

    void loadSubscriptionPlan();
  }, [isSubscriptionCheckout]);

  useEffect(() => {
    if (hasGstin && billingState) {
      const stateCode = GST_STATE_CODES[billingState];
      if (stateCode) {
        setCustomerGstin((prev) => {
          const suffix = prev.length >= 2 ? prev.slice(2) : "";
          return stateCode + suffix;
        });
      }
    }
  }, [billingState, hasGstin]);

  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 8000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && window.location.pathname.includes('payment-success')) {
      setIsVerifyingSuccess(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isSubscriptionCheckout || cart.length === 0 || grandTotal <= 0) {
      setAppliedCoupon(null);
      setCouponInput('');
      setCouponFeedback(null);
      return;
    }

    if (!getToken()) {
      setAppliedCoupon(null);
      setCouponFeedback(null);
      return;
    }

    if (appliedCoupon?.source === 'manual' && appliedCoupon.couponCode) {
      void applyCouponCode(appliedCoupon.couponCode, 'manual');
      return;
    }

    if (!hasDismissedAutoCoupon) {
      void autoApplyCoupon();
    }
  }, [grandTotal, cart.length, isSubscriptionCheckout, user?.id, hasDismissedAutoCoupon]);

  const couponFeedbackIsError = Boolean(
    couponFeedback && !appliedCoupon && couponFeedback !== "Coupon removed."
  );

  if (isOpeningGateway || isVerifyingSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-500">
        <div className="relative mb-8">
          <div className="h-20 w-20 animate-spin rounded-full border-2 border-gray-100 border-t-black" />
          {isVerifyingSuccess && (
            <CheckCircle2 className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-black" />
          )}
        </div>
        <h2 className="mb-3 font-serif text-3xl tracking-tight text-[#1A1A1A]">
          {isVerifyingSuccess ? "Confirming Payment" : "Opening Secure Gateway"}
        </h2>
        <p className="text-sm text-gray-400">
          {isVerifyingSuccess ? "Finalizing your order records..." : "Preparing transaction window..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white py-4">
        <div className="container mx-auto flex items-center justify-between px-6">
          <button
            onClick={() => {
              if (isSubscriptionCheckout) {
                navigate('/subscription');
                return;
              }

              step === 'details' ? setStep('review') : navigate('/cart');
            }}
            className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-black"
          >
            <ArrowLeft size={16} />
            {isSubscriptionCheckout ? 'Back to Plans' : step === 'details' ? 'Review Order' : 'Back to Cart'}
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <ShieldCheck size={16} />
            <span className="text-xs">Secure Checkout</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-6xl">
          {errorMsg && (
            <div className="mb-10 flex items-start gap-4 rounded-md border border-red-100 bg-red-50 p-5 text-red-900 animate-in slide-in-from-top-4 duration-500">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">Payment Issue</p>
                <p className="opacity-80">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)}>
                <X size={18} />
              </button>
            </div>
          )}

          <div className="mb-16">
            <span className="text-xs text-gray-400">
              {isSubscriptionCheckout ? 'Subscription Checkout' : step === 'review' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
            <h1 className="mt-2 font-serif text-4xl text-[#1A1A1A]">
              {isSubscriptionCheckout ? 'Review Subscription' : step === 'review' ? 'Review Items' : 'Shipping & Billing'}
            </h1>
          </div>

          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              {isSubscriptionCheckout ? (
                <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
                  {isLoadingSubscriptionPlan ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  ) : selectedSubscriptionPlan ? (
                    <div>
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                            {selectedSubscriptionPlan.planType}
                          </p>
                          <h2 className="mt-3 font-serif text-3xl text-[#1A1A1A]">
                            {selectedSubscriptionPlan.name}
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-gray-500">
                            {selectedSubscriptionPlan.billingCycle === 'MONTHLY'
                              ? 'Billed monthly for flexible studio access.'
                              : 'Billed yearly for uninterrupted studio access.'}
                          </p>
                        </div>
                        <div className="rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                          {selectedSubscriptionPlan.billingCycle}
                        </div>
                      </div>

                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Designs</p>
                          <p className="mt-2 text-2xl font-semibold text-black">{selectedSubscriptionPlan.designLimit}</p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">AI Credits</p>
                          <p className="mt-2 text-2xl font-semibold text-black">{selectedSubscriptionPlan.creditLimit}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                      <p className="font-serif text-2xl text-[#1A1A1A]">Plan not found</p>
                      <p className="mt-2 text-sm text-gray-500">Please choose a subscription plan again.</p>
                    </div>
                  )}
                </div>
              ) : step === 'review' ? (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white shadow-sm">
                  {cart.map((item) => (
                    <div key={item.id} className="group flex items-center gap-8 p-8 transition-all hover:bg-gray-50/50">
                      <div className="h-24 w-24 overflow-hidden rounded-md border border-gray-100 bg-[#F9F9F9] p-1">
                        <img
                          src={getAssetUrl(item.assetUuid)}
                          alt={item.designTitle}
                          className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-xl text-[#1A1A1A]">{item.designTitle}</h3>
                        <div className="mt-2 flex items-center gap-6 text-sm text-gray-500">
                          <span>Qty {item.quantity}</span>
                          <span className="font-medium text-black">{formatPrice(item.priceCents)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8 rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Email Address *</Label>
                      <Input
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        type="email"
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Street Address *</Label>
                      <Input
                        value={addressOne}
                        onChange={(e) => setAddressOne(e.target.value)}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Address Line 2</Label>
                      <Input
                        value={addressTwo}
                        onChange={(e) => setAddressTwo(e.target.value)}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Organization</Label>
                      <Input
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">City *</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Pincode *</Label>
                      <Input
                        value={pincode}
                        onChange={(e) => {
                          const nextValue = e.target.value.replace(/\D/g, '');
                          if (nextValue.length <= 6) setPincode(nextValue);
                        }}
                        maxLength={6}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Phone *</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => {
                          const nextValue = e.target.value.replace(/\D/g, '');
                          if (nextValue.length <= 10) setCustomerPhone(nextValue);
                        }}
                        maxLength={10}
                        className="h-11 rounded-md border-gray-200 px-4 focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">State *</Label>
                      <select
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        className="h-11 w-full cursor-pointer rounded-md border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="">Select State</option>
                        {Object.keys(GST_STATE_CODES).sort().map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="group w-fit cursor-pointer items-center space-x-3">
                      <Checkbox
                        checked={hasGstin}
                        onCheckedChange={(checked) => setHasGstin(checked as boolean)}
                        className="border-gray-300 data-[state=checked]:border-black data-[state=checked]:bg-black"
                      />
                      <span className="text-sm text-gray-600 transition-colors group-hover:text-black">
                        Registered GST Business
                      </span>
                    </label>

                    {hasGstin && (
                      <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Label className="text-sm font-medium text-gray-700">GSTIN Identification *</Label>
                        <Input
                          value={customerGstin}
                          onChange={(e) => {
                            let nextValue = e.target.value.toUpperCase();
                            if (billingState) {
                              const code = GST_STATE_CODES[billingState];
                              nextValue = code + nextValue.slice(2);
                            }
                            setCustomerGstin(nextValue);
                          }}
                          maxLength={15}
                          className="h-11 rounded-md border-gray-200 px-4 font-mono tracking-wide focus:ring-1 focus:ring-black"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="mb-8 font-serif text-2xl text-[#1A1A1A]">Summary</h2>

                {!isSubscriptionCheckout && (
                  <div className="mb-8 rounded-md border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1A1A1A]">Coupon</span>
                      {appliedCoupon && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 transition-colors hover:text-black"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="h-11 border-gray-200 bg-white px-4 uppercase tracking-[0.12em] focus:ring-1 focus:ring-black"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="h-11 border-gray-200 px-5 text-xs font-bold uppercase tracking-[0.18em]"
                      >
                        {isApplyingCoupon ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Applying
                          </span>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>

                    {couponFeedback && (
                      <p className={`mt-3 text-sm ${couponFeedbackIsError ? 'text-red-600' : 'text-emerald-600'}`}>
                        {couponFeedback}
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-8 space-y-4 text-sm">
                  {isSubscriptionCheckout ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plan</span>
                        <span className="text-right font-medium">{selectedSubscriptionPlan?.name || 'Subscription'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Billing</span>
                        <span className="font-medium">{selectedSubscriptionPlan?.billingCycle || '-'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Net Amount</span>
                        <span className="font-medium">{formatPrice(taxableSubtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="italic text-gray-500">GST (18% Incl.)</span>
                        <span className="text-gray-400">{formatPrice(gstAmount)}</span>
                      </div>
                      {appliedCoupon && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Coupon</span>
                            <span className="font-medium uppercase">{appliedCoupon.couponCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Discount</span>
                            <span className="font-medium text-emerald-600">- {formatPrice(discountAmountCents)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="my-6 h-px bg-gray-100" />

                  <div className="flex items-end justify-between">
                    <span className="text-base font-medium">Total Payable</span>
                    <span className="text-3xl font-bold text-black">
                      {isSubscriptionCheckout
                        ? selectedSubscriptionPlan
                          ? formatPlanPrice(selectedSubscriptionPlan.price)
                          : '-'
                        : formatPrice(finalPayableCents)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={
                    isProcessing ||
                    isOpeningGateway ||
                    isLoadingSubscriptionPlan ||
                    isApplyingCoupon ||
                    (isSubscriptionCheckout ? !selectedSubscriptionPlan : cart.length === 0)
                  }
                  className="h-14 w-full rounded-md bg-black text-sm font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : isSubscriptionCheckout ? (
                    "Proceed To Payment"
                  ) : step === 'review' ? (
                    "Continue to Shipping"
                  ) : (
                    "Initialize Payment"
                  )}
                </Button>

                <div className="mt-8 flex items-center justify-center gap-2 border-t border-gray-100 pt-8 opacity-40 grayscale">
                  <CreditCard size={16} />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Secure Payment via Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
