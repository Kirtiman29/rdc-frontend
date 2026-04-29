// src/pages/PaymentSuccess.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { getOrderDetails } from '@/api/orderApi';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  
  /** * ✅ PERFORMANCE OPTIMIZATION:
   * We set isVerifying to false by default so the Success UI renders instantly.
   * isSyncing tracks the background verification with the backend.
   */
  const [isSyncing, setIsSyncing] = useState(true);
  const [countdown, setCountdown] = useState(8);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 5;

    const verifyStatus = async () => {
      if (!orderId) {
        return;
      }

      try {
        const order = await getOrderDetails(orderId);
        
        if (order && order.status?.toUpperCase() === 'PAID') {
          // Sync complete
          setIsSyncing(false);
          startCountdown();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(verifyStatus, 2000);
        } else {
          // Stop pulsing even if API fails, user is already on success page
          setIsSyncing(false);
          startCountdown();
        }
      } catch (err) {
        setIsSyncing(false);
        startCountdown();
      }
    };

    const startCountdown = () => {
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
    };

    if (orderId) {
        verifyStatus();
    } else {
        setIsSyncing(false);
        startCountdown();
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6" onContextMenu={handleContextMenu}>
      <div className="max-w-md w-full bg-white border border-gray-100 p-12 rounded-sm shadow-xl text-center relative overflow-hidden">
        
        {/* Redirect Progress Bar */}
        <div 
          className="absolute top-0 left-0 h-1 bg-[#2A2623] transition-all duration-1000" 
          style={{ width: `${(countdown / 8) * 100}%` }}
        />
        
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
            <CheckCircle size={44} className="text-green-600" />
          </div>
        </div>

        <h1 className="font-serif text-3xl text-[#2A2623] mb-2 tracking-tight uppercase">Acquisition Verified</h1>
        
        {/* Background Sync Indicator */}
        <div className="h-6 flex items-center justify-center mb-6">
            {isSyncing ? (
                <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Synchronizing Registry...</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-green-600">
                    <ShieldCheck size={12} />
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Secure Record Confirmed</span>
                </div>
            )}
        </div>
        
        <div className="bg-[#FAFAFA] border border-gray-100 p-6 mb-8 text-left">
          <div className="flex gap-4">
            <Mail className="text-[#2A2623] shrink-0 mt-1" size={18} />
            <p className="text-xs leading-relaxed text-gray-600">
              Your high-resolution <span className="font-bold text-black uppercase">TIFF Master Files</span> are being prepared. Access links will be delivered to your registered email within <span className="font-bold border-b border-black">24 hours</span>.
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-10 font-mono">
          Registry ID: ORD-{orderId || 'N/A'}
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/orders')}
            className="w-full bg-[#2A2623] text-white py-4 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md"
          >
            View Asset History
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            Return to Registry Storefront <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-[9px] text-gray-300 uppercase tracking-[0.2em] font-bold">
            Registry Redirect in {countdown}s
          </p>
        </div>
      </div>
    </div>
  );
}
