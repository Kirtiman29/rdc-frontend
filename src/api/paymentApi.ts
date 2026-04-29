import { paymentApi } from "./apiClient";

interface CreatePaymentSessionResponse {
  gatewayOrderId: string;
  amountCents: number;
  currency: string;
  razorpayKey: string;
}

interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface VerifyPaymentResponse {
  status: "SUCCESS" | "PAID" | "FAILED" | string;
}

const initiateGatewaySession = async (orderId: number): Promise<CreatePaymentSessionResponse> => {
  if (!orderId || Number.isNaN(orderId)) {
    throw new Error("Invalid Order ID");
  }

  return await paymentApi.post<CreatePaymentSessionResponse, CreatePaymentSessionResponse>(
    "/create",
    {
      purchaseType: "ORDER",
      orderId,
    }
  );
};

const verifyPayment = async (
  verificationData: VerifyPaymentPayload
): Promise<VerifyPaymentResponse> => {
  return await paymentApi.post<VerifyPaymentResponse, VerifyPaymentResponse>(
    "/verify",
    verificationData
  );
};

export const processIndustrialPayment = async (
  orderId: number,
  navigate: (path: string) => void,
  userProfile: {
    name: string;
    email: string;
    onPaymentStart?: () => void;
    onPaymentSuccess?: () => void;
  }
) => {
  try {
    const data = await initiateGatewaySession(orderId);

    if (!data?.gatewayOrderId) {
      throw new Error("Failed to initialize payment.");
    }

    const amountPaise = Math.round(Number(data.amountCents));

    const options = {
      key: data.razorpayKey,
      amount: amountPaise,
      currency: data.currency,
      order_id: data.gatewayOrderId,
      name: "RDC Industrial Archive",
      description: `Order #${orderId}`,
      notes: {
        orderId: orderId.toString(),
      },
      theme: { color: "#CC000E" },
      prefill: {
        name: userProfile.name || "User",
        email: userProfile.email || "",
        contact: "",
      },
      handler: async (response: VerifyPaymentPayload) => {
        try {
          const verifyData = await verifyPayment(response);

          if (verifyData.status === "SUCCESS" || verifyData.status === "PAID") {
            userProfile.onPaymentSuccess?.();
            navigate(`/payment-success?orderId=${orderId}`);
            return;
          }

          navigate(`/payment-failure?orderId=${orderId}`);
        } catch (err) {
          console.error("Payment verification failed:", err);
          navigate(`/payment-failure?orderId=${orderId}`);
        }
      },
      modal: {
        ondismiss: () => {
          console.warn("Payment popup closed by user");
        },
        backdropclose: false,
      },
    };

    if (!(window as any).Razorpay) {
      throw new Error("Razorpay SDK not loaded");
    }

    const rzp = new (window as any).Razorpay(options);

    rzp.on("payment.failed", (response: any) => {
      console.error("Payment failed:", response?.error || response);
      alert("Payment failed. Please try again.");
    });

    userProfile.onPaymentStart?.();
    rzp.open();
  } catch (error: any) {
    console.error("Payment process error:", error);

    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      "Payment service unavailable";

    alert(`Error: ${errorMsg}`);
  }
};
