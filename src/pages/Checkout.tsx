import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { createOrder } from '@/api/orderApi'; 
import { processIndustrialPayment } from '@/api/paymentApi';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Loader2, ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { useCart } from '@/hooks/useCart'; 
import { useAuth } from '@/hooks/useAuth';
import { getAssetUrl } from '@/api/apiClient';

export default function Checkout() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { items: cart } = useCart(); 
    const [isProcessing, setIsProcessing] = useState(false);
    
    // ✅ NEW: State to show buffering while waiting for redirect data
    const [isVerifyingRedirect, setIsVerifyingRedirect] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    useEffect(() => {
        // ✅ LOGIC: If we return from Razorpay with an orderId, show buffering immediately
        const orderId = searchParams.get('orderId');
        if (orderId) {
            setIsVerifyingRedirect(true);
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, [searchParams]);

    const calculateTotal = () => cart.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);
        try {
            const order = await createOrder();
            await processIndustrialPayment(order.id, navigate, {
                name: user?.name || "Industrial User",
                email: user?.email || "user@rdc-archive.com"
            });
        } catch (error) {
            console.error("Checkout failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // ✅ FULL SCREEN BUFFERING COMPONENT
    if (isVerifyingRedirect) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-gray-100 border-t-[#2A2623] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Shield size={20} className="text-[#2A2623] opacity-20" />
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="font-serif text-xl text-[#2A2623] mb-2">Finalizing Transaction</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 animate-pulse">
                        Synchronizing with Bank Gateway...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" onContextMenu={handleContextMenu}>
            {/* ... (Keep your existing Header and Main content exactly as is) ... */}
            <div className="bg-white border-b border-gray-100 py-4">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link to="/cart" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                        <ArrowLeft size={16} /> Back to Cart
                    </Link>
                    <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Session</span>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-16">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Review Purchase</span>
                        <h1 className="font-serif text-4xl mt-2 text-[#1A1A1A]">Confirm Acquisition</h1>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-16 items-start">
                        {/* LEFT COLUMN: Order Review (Cart Style) */}
                        <div className="lg:col-span-8 space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="group relative bg-[#FAFAFA] border border-gray-100 p-6 flex gap-8 items-center transition-all">
                                    <div className="relative w-24 h-24 bg-white overflow-hidden border border-gray-100 flex-shrink-0 select-none shadow-sm">
                                        <div 
                                            className="absolute inset-0 z-10 pointer-events-none opacity-[0.15]"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='5' font-weight='900' fill='none' stroke='black' stroke-width='0.1' text-anchor='middle' transform='rotate(-35 15 15)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'repeat'
                                            }}
                                        />
                                        <img 
                                            src={getAssetUrl(item.assetUuid)} 
                                            alt="" 
                                            draggable={false}
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif text-xl text-[#1A1A1A] mb-1">{item.designTitle}</h3>
                                        <p className="text-xs text-gray-400 font-medium">
                                            Industrial Design Asset (Quantity: {item.quantity})
                                        </p>
                                        <div className="mt-4">
                                            <span className="text-lg font-medium text-[#1A1A1A]">
                                                ₹{(item.priceCents / 100).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2 text-gray-200">
                                        <Lock size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT COLUMN: Summary Card */}
                        <div className="lg:col-span-4">
                            <div className="bg-[#FAFAFA] border border-gray-100 p-8 rounded-sm sticky top-8">
                                <h2 className="font-serif text-2xl mb-8 text-[#1A1A1A]">Order Summary</h2>
                                
                                <div className="space-y-4 mb-10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-900 font-medium">₹{(calculateTotal() / 100).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tax</span>
                                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Calculated at checkout</span>
                                    </div>
                                    <div className="h-[1px] bg-gray-200 my-6" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-serif">Total</span>
                                        <span className="text-3xl font-bold text-[#1A1A1A]">
                                            ₹{(calculateTotal() / 100).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleCheckout} 
                                    disabled={isProcessing || cart.length === 0} 
                                    className="w-full h-14 bg-[#2A2623] hover:bg-black text-white font-medium transition-all active:scale-[0.99] rounded-none uppercase tracking-widest text-xs"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2"><Loader2 className="animate-spin w-4" /> Authorizing...</span>
                                    ) : (
                                        "Proceed to Checkout"
                                    )}
                                </Button>

                                <p className="mt-6 text-center text-[10px] text-gray-400 italic">
                                    Designs are delivered via secure asset streaming after payment.
                                </p>
                                
                                <div className="mt-8 flex items-center justify-center gap-2 text-gray-300">
                                    <CreditCard size={12} />
                                    <span className="text-[9px] uppercase tracking-widest font-bold">Razorpay Secure Gateway</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}