import { paymentApi } from './apiClient';

const initiateGatewaySession = async (orderId: number) => {
    // ✅ Interceptor in apiClient.ts already returns response.data
    return await paymentApi.post('/create', { orderId });
};

const verifyPayment = async (verificationData: any) => {
    return await paymentApi.post('/verify', verificationData);
};

export const processIndustrialPayment = async (
    orderId: number, 
    navigate: any, 
    userProfile: { name: string; email: string }
) => {
    try {
        const data: any = await initiateGatewaySession(orderId);
        const { gatewayOrderId, amountCents, razorpayKey } = data;

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
                    const verifyData: any = await verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (verifyData.status === 'SUCCESS' || verifyData.status === 'PAID') {
                        navigate(`/payment-success?orderId=${orderId}`);
                    } else {
                        navigate(`/payment-failure?orderId=${orderId}`);
                    }
                } catch (err) {
                    navigate(`/payment-failure?orderId=${orderId}`);
                }
            },
            modal: { 
                ondismiss: () => console.warn("⚠️ User closed the payment modal"),
                backdropclose: false 
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || "Payment service temporarily unavailable";
        alert(errorMsg);
    }
};