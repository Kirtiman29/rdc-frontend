import { paymentApi } from './apiClient';

/**
 * ✅ Step 1: Request Payment Session from Backend
 * Hits: POST https://ruchitadesigncompany.in/api/payments/create
 */
const initiateGatewaySession = async (orderId: number) => {
    /** * Ensuring orderId is sent exactly as the backend expects.
     * Some Java backends are strict about Long vs String.
     */
    return await paymentApi.post('/create', { orderId: Number(orderId) });
};

/**
 * ✅ Step 2: Send Razorpay credentials back for verification
 * Hits: POST https://ruchitadesigncompany.in/api/payments/verify
 */
const verifyPayment = async (verificationData: any) => {
    return await paymentApi.post('/verify', verificationData);
};

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
         * Razorpay expects 'amount' in paise (smallest currency unit).
         * If your backend sends 500.00 cents, we ensure it's a clean integer.
         */
        const amountPaise = Math.round(Number(amountCents));

        const options = {
            key: razorpayKey,
            amount: amountPaise,
            currency: "INR",
            order_id: gatewayOrderId,
            name: "RDC Industrial Archive",
            description: `Production Assets: Order #${orderId}`,
            theme: { color: "#CC000E" },
            prefill: {
                name: userProfile.name || "Industrial User",
                email: userProfile.email || "user@rdc-archive.com",
                contact: "9999999999"
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
                     * We handle both 'SUCCESS' and 'PAID' statuses depending on backend DTO.
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

        const rzp = new (window as any).Razorpay(options);
        
        // Handle failure to open (e.g., blocked by popup blocker)
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