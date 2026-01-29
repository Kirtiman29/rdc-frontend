// src/pages/PaymentFailure.tsx

import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCcw, ArrowLeft } from 'lucide-react';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/10 p-6">
      <div className="max-w-md w-full bg-background border border-border p-8 rounded-2xl shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={32} className="text-red-600" />
          </div>
        </div>

        <h1 className="font-serif text-2xl mb-2">Payment Failed</h1>
        <p className="text-muted-foreground text-sm mb-8">
          The transaction could not be completed. This may be due to insufficient funds or a gateway timeout.
        </p>

        <div className="space-y-3">
          <Link to="/checkout" className="flex items-center justify-center gap-2 w-full bg-[#D10A0A] text-white py-3 rounded-xl font-semibold hover:bg-[#B00909]">
            <RefreshCcw size={18} /> Retry Checkout
          </Link>
          <Link to="/" className="flex items-center justify-center gap-2 w-full border border-border py-3 rounded-xl font-semibold hover:bg-secondary/50">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}