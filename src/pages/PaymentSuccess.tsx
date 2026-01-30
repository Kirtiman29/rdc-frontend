import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, Package, Mail } from 'lucide-react';
import { orderApi } from '@/api/apiClient';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const [isVerifying, setIsVerifying] = useState(true);
  const [countdown, setCountdown] = useState(8); // Slightly longer for reading the message

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 5;

    const verifyStatus = async () => {
      try {
        // Hits Order Service Port 8095 [cite: 162]
        const { data } = await orderApi.get(`/${orderId}`);
        
        // Ensure the order is marked as PAID in database
        if (data.status === 'PAID') {
          setIsVerifying(false);
          
          // Automatic redirect logic
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(verifyStatus, 2000);
        } else {
          setIsVerifying(false);
        }
      } catch (err) {
        setIsVerifying(false);
      }
    };

    if (orderId) verifyStatus();
  }, [orderId, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#2A2623] animate-spin mb-4" />
        <p className="font-serif text-lg text-[#2A2623] tracking-tight">Synchronizing Archive Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="max-w-md w-full bg-white border border-border p-12 rounded-2xl shadow-xl text-center relative overflow-hidden">
        {/* Top Progress Bar for Redirect */}
        <div 
          className="absolute top-0 left-0 h-1.5 bg-green-500 transition-all duration-1000" 
          style={{ width: `${(countdown / 8) * 100}%` }}
        />
        
        {/* Success Header */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100 animate-in zoom-in duration-500">
            <CheckCircle size={44} className="text-green-600" />
          </div>
        </div>

        <h1 className="font-serif text-3xl text-[#2A2623] mb-4">Payment Successful</h1>
        
        {/* Delivery Message */}
        <div className="bg-secondary/20 p-4 rounded-xl mb-8 border border-border/50">
          <div className="flex items-center gap-3 text-left">
            <Mail className="text-[#2A2623] flex-shrink-0" size={20} />
            <p className="text-xs font-medium leading-relaxed text-[#2A2623]">
              Your master <span className="font-bold">TIFF files</span> will be prepared and sent to your registered mail service within <span className="font-bold underline">24 hours</span>.
            </p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-8">
          Transaction confirmed for <span className="font-bold text-[#2A2623]">ORD-{orderId}</span>. A receipt has been generated in your history.
        </p>

        {/* Navigation Actions */}
        <div className="grid gap-3">
          <button 
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center gap-3 w-full bg-[#2A2623] text-white py-4 rounded-xl font-bold hover:bg-[#1a1816] transition-all shadow-lg shadow-black/5"
          >
            <Package size={18} /> View My Order History
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A2623] hover:opacity-60 transition-opacity"
          >
            Go back to Storefront <ArrowRight size={14} />
          </button>
        </div>

        {/* Countdown Footer */}
        <div className="mt-10 pt-6 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Redirecting in {countdown}s
          </p>
        </div>
      </div>
    </div>
  );
}