// paymentApi.ts
import { paymentApi } from './apiClient';

/**
 * ✅ Step 1: Request Payment Session from Backend
 * Hits: POST /api/payments/create
 */
const initiateGatewaySession = async (orderId: number) => {
    /** * Ensuring orderId is sent exactly as the backend expects.
     * Some Java backends are strict about Long vs String.
     */
    return await paymentApi.post('/create', { orderId: Number(orderId) });
};

/**
 * ✅ Step 2: Send Razorpay credentials back for verification
 * Hits: POST /api/payments/verify
 */
const verifyPayment = async (verificationData: any) => {
    return await paymentApi.post('/verify', verificationData);
};

/**
 * Main Industrial Payment Processor
 */
export const processIndustrialPayment = async (
    orderId: number, 
    navigate: any, 
    userProfile: { name: string; email: string }
) => {
    try {
        // Fetch session data from backend
        const data: any = await initiateGatewaySession(orderId);
        
        // Safety check: ensure the backend actually returned the required keys
        if (!data || !data.gatewayOrderId) {
            console.error("Payment Init Error: Missing gateway data", data);
            throw new Error("Could not initialize payment session with gateway.");
        }

        const { gatewayOrderId, amountCents, razorpayKey } = data;
        
        /**
         * ✅ RAZORPAY UNIT LOGIC
         * Razorpay expects 'amount' in paise (smallest currency unit).
         * Our backend already calculates totals in cents/paise.
         * We use Math.round(Number * 1) to ensure it's a clean integer for the JS SDK.
         */
        const amountPaise = Math.round(Number(amountCents) * 1);

        const options = {
            key: razorpayKey,
            amount: amountPaise,
            currency: "INR",
            order_id: gatewayOrderId,
            name: "RDC Industrial Archive",
            description: `Production Assets: Order #${orderId}`,
            theme: { color: "#CC000E" },
            prefill: {
                name: userProfile.name || "User",
                email: userProfile.email || "",
                contact: ""
            },
            handler: async (response: any) => {
                try {
                    // Send signature and IDs to backend for verification
                    const verifyData: any = await verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    /**
                     * ✅ VERIFICATION LOGIC
                     * Success statuses can be 'SUCCESS' or 'PAID'
                     */
                    if (verifyData.status === 'SUCCESS' || verifyData.status === 'PAID') {
                        navigate(`/payment-success?orderId=${orderId}`);
                    } else {
                        navigate(`/payment-failure?orderId=${orderId}`);
                    }
                } catch (err) {
                    console.error("Verification Error:", err);
                    navigate(`/payment-failure?orderId=${orderId}`);
                }
            },
            modal: { 
                ondismiss: () => {
                    console.warn("⚠️ User closed the payment modal");
                },
                backdropclose: false 
            }
        };

        // Initialize Razorpay
        const rzp = new (window as any).Razorpay(options);
        
        rzp.on('payment.failed', function (response: any) {
            console.error("Payment Failed Callback:", response.error);
        });

        rzp.open();
        
    } catch (error: any) {
        console.error("Process Payment Catch:", error);
        const errorMsg = error.response?.data?.message || error.message || "Payment service temporarily unavailable";
        alert(`Error: ${errorMsg}`);
    }
};