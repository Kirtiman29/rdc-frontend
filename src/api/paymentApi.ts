import axios from "axios";
import { paymentApi } from "./apiClient";

/* =========================================
   STEP 1: CREATE PAYMENT SESSION
   (RAW axios to avoid interceptor issues)
========================================= */
const initiateGatewaySession = async (orderId: number) => {

    // 🔥 HARD VALIDATION (MOST IMPORTANT FIX)
    if (!orderId || isNaN(orderId)) {
        console.error("❌ INVALID ORDER ID:", orderId);
        throw new Error("Invalid Order ID");
    }

    console.log("🔥 SENDING ORDER ID:", orderId);

    const res = await axios.post(
        "/api/payments/create",
        { orderId }, // ✅ DO NOT USE Number()
        {
            baseURL:
                import.meta.env.VITE_PAYMENT_SERVICE_URL ||
                "https://ruchitadesigncompany.in",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    console.log("💰 PAYMENT INIT RESPONSE:", res.data);

    return res.data;
};

/* =========================================
   STEP 2: VERIFY PAYMENT
========================================= */
const verifyPayment = async (verificationData: any) => {
    return await paymentApi.post("/verify", verificationData);
};

/* =========================================
   MAIN PAYMENT FLOW
========================================= */
export const processIndustrialPayment = async (
    orderId: number,
    navigate: any,
    userProfile: {
        name: string;
        email: string;
        onPaymentStart?: () => void;
        onPaymentSuccess?: () => void;
    }
) => {
    try {
        console.log("🚀 START PAYMENT FLOW, ORDER:", orderId);

        /* ================================
           STEP 1: INIT PAYMENT
        ================================= */
        const data = await initiateGatewaySession(orderId);

        if (!data || !data.gatewayOrderId) {
            console.error("❌ Payment Init Error:", data);
            throw new Error("Failed to initialize payment.");
        }

        const { gatewayOrderId, amountCents, razorpayKey } = data;

        const amountPaise = Math.round(Number(amountCents));

        /* ================================
           STEP 2: RAZORPAY OPTIONS
        ================================= */
        const options = {
            key: razorpayKey,
            amount: amountPaise,
            currency: "INR",
            order_id: gatewayOrderId,
            name: "RDC Industrial Archive",
            description: `Order #${orderId}`,

            notes: {
                orderId: orderId.toString()
            },

            theme: { color: "#CC000E" },

            prefill: {
                name: userProfile.name || "User",
                email: userProfile.email || "",
                contact: ""
            },

            /* ================================
               SUCCESS HANDLER
            ================================= */
            handler: async (response: any) => {
                try {
                    console.log("✅ PAYMENT SUCCESS:", response);

                    const verifyRes: any = await verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    const verifyData = verifyRes?.data || verifyRes;

                    if (
                        verifyData.status === "SUCCESS" ||
                        verifyData.status === "PAID"
                    ) {
                        userProfile.onPaymentSuccess?.();
                        navigate(`/payment-success?orderId=${orderId}`);
                    } else {
                        navigate(`/payment-failure?orderId=${orderId}`);
                    }

                } catch (err) {
                    console.error("❌ Verification Error:", err);
                    navigate(`/payment-failure?orderId=${orderId}`);
                }
            },

            modal: {
                ondismiss: () => {
                    console.warn("⚠️ Payment popup closed by user");
                },
                backdropclose: false
            }
        };

        /* ================================
           STEP 3: OPEN RAZORPAY
        ================================= */

        if (!(window as any).Razorpay) {
            throw new Error("Razorpay SDK not loaded");
        }

        const rzp = new (window as any).Razorpay(options);

        rzp.on("payment.failed", function (response: any) {
            console.error("❌ Payment Failed:", response.error);
            alert("Payment failed. Please try again.");
        });

        userProfile.onPaymentStart?.();

        rzp.open();

    } catch (error: any) {
        console.error("❌ Payment Process Error:", error);

        const errorMsg =
            error.response?.data?.message ||
            error.message ||
            "Payment service unavailable";

        alert(`Error: ${errorMsg}`);
    }
};