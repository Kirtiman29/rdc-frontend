import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCcw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="max-w-md w-full bg-white border border-gray-100 p-12 rounded-sm shadow-xl text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
            <XCircle size={44} className="text-red-600" />
          </div>
        </div>

        <h1 className="font-serif text-3xl text-[#2A2623] mb-4">Transaction Declined</h1>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
          The payment could not be processed by the gateway. Please verify your credentials or try a different payment method.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/checkout')}
            className="flex items-center justify-center gap-3 w-full bg-[#D10A0A] text-white py-4 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
          >
            <RefreshCcw size={16} /> Attempt Re-authorization
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} /> Cancel and Exit
          </button>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-300">
            <AlertCircle size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Support Ref: ERR-{orderId || 'TXN'}</span>
        </div>
      </div>
    </div>
  );
}