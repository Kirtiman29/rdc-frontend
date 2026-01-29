import { paymentApi } from './apiClient';

/**
 * ✅ PART 1: Backend Endpoints
 * Standardized to use the paymentApi instance and relative paths.
 * Note: createOrder has been moved to orderApi.ts to prevent duplication.
 */

const initiateGatewaySession = async (orderId: number) => {
    // Hits Port 8092: /api/payments/create
    const response = await paymentApi.post('/create', { orderId });
    return response.data;
};

const verifyPayment = async (verificationData: any) => {
    // Hits Port 8092: /api/payments/verify
    const response = await paymentApi.post('/verify', verificationData);
    return response.data;
};

/**
 * ✅ PART 2: Consolidated Razorpay Flow
 * FIXED: Amount precision and strict pre-fill formatting to prevent 400 errors.
 */
export const processIndustrialPayment = async (
    orderId: number, 
    navigate: any, 
    userProfile: { name: string; email: string }
) => {
    try {
        console.log("💳 Syncing session with Payment Service...");
        const { gatewayOrderId, amountCents, razorpayKey } = await initiateGatewaySession(orderId);

        // ✅ INDUSTRIAL FIX: Ensure 'amount' is a rounded integer (no decimals)
        // Razorpay API returns 400 Bad Request if it receives a float.
        const amountPaise = Math.round(Number(amountCents));

        const options = {
            key: razorpayKey,
            amount: amountPaise,
            currency: "INR",
            order_id: gatewayOrderId, // Required for secure server-side verification
            name: "RDC Industrial Archive",
            description: `Production Assets: Order #${orderId}`,
            theme: { color: "#CC000E" },
            
            // ✅ FIX: Adding strict prefill triggers the simulator correctly in test mode
            prefill: {
                name: userProfile.name || "Industrial User",
                email: userProfile.email || "user@rdc-archive.com",
                contact: "9999999999" // Strict 10-digit string for simulation
            },

            handler: async (response: any) => {
                console.log("🔐 Gateway authorized. Verifying signature...");
                try {
                    // Send to Payment Service Port 8092 for signature verification
                    const verifyData = await verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    // Check for success status returned by Payment Service
                    if (verifyData.status === 'SUCCESS' || verifyData.status === 'PAID') {
                        console.log("✅ Payment Verified Successfully");
                        navigate(`/payment-success?orderId=${orderId}`);
                    } else {
                        console.error("❌ Verification failed status");
                        navigate(`/payment-failure?orderId=${orderId}`);
                    }
                } catch (err) {
                    console.error("❌ Signature verification API error", err);
                    navigate(`/payment-failure?orderId=${orderId}`);
                }
            },
            modal: { 
                ondismiss: () => {
                    console.warn("⚠️ User closed the payment modal");
                },
                // Ensures simulator doesn't close accidentally
                backdropclose: false 
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        
    } catch (error: any) {
        console.error("❌ Payment initiation critical failure:", error);
        const errorMsg = error.response?.data?.message || "Payment service temporarily unavailable";
        alert(errorMsg);
    }
};