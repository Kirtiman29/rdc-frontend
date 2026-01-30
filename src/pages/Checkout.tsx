import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createOrder } from '@/api/orderApi'; 
import { processIndustrialPayment } from '@/api/paymentApi';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { useCart } from '@/hooks/useCart'; 
import { useAuth } from '@/hooks/useAuth';
import { getAssetUrl } from '@/api/apiClient';

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items: cart } = useCart(); 
    const [isProcessing, setIsProcessing] = useState(false);

    // ✅ Security: Restrict Right-Click on checkout review
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);

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

    return (
        <div className="min-h-screen bg-[#FAFAFA]" onContextMenu={handleContextMenu}>
            <div className="bg-white border-b border-border py-4">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link to="/cart" className="flex items-center gap-2 text-sm font-medium hover:text-[#2A2623] transition-colors">
                        <ArrowLeft size={16} /> Back to Cart
                    </Link>
                    <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Session</span>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-12 text-left">
                <div className="grid lg:grid-cols-12 gap-12 items-start max-w-6xl mx-auto">
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <h1 className="font-serif text-4xl mb-2 text-[#2A2623]">Review Purchase</h1>
                            <p className="text-muted-foreground italic">Confirm your digital asset acquisition.</p>
                        </div>

                        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border bg-secondary/10">
                                <h2 className="font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Order Composition</h2>
                            </div>
                            <div className="divide-y divide-border">
                                {cart.map((item) => (
                                    <div key={item.id} className="p-6 flex gap-6 items-center">
                                        {/* ✅ Protected Thumbnail */}
                                        <div className="relative w-16 h-16 bg-secondary/30 rounded-lg overflow-hidden border border-border flex-shrink-0 select-none">
                                            
                                            {/* MICRO-WATERMARK OVERLAY */}
                                            <div 
                                                className="absolute inset-0 z-10 pointer-events-none opacity-[0.20]"
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='5' font-weight='900' fill='none' stroke='white' stroke-width='0.15' text-anchor='middle' transform='rotate(-35 15 15)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'repeat'
                                                }}
                                            />

                                            <img 
                                                src={getAssetUrl(item.assetUuid)} 
                                                alt="" 
                                                draggable={false} // ✅ Prevent drag
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <h3 className="font-serif text-lg truncate text-[#2A2623]">{item.designTitle}</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Digital License × {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#2A2623]">₹{(item.priceCents / 100).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="bg-white border border-border p-8 rounded-2xl shadow-xl sticky top-8 text-left">
                            <h2 className="font-serif text-xl mb-6 text-[#2A2623]">Payment Summary</h2>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">Inventory Subtotal</span>
                                    <span className="text-[#2A2623] font-bold">₹{(calculateTotal() / 100).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-[1px] bg-border my-2" />
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold uppercase tracking-widest text-[#2A2623]">Total Payable</span>
                                    <span className="text-4xl font-bold text-[#2A2623]">
                                        ₹{(calculateTotal() / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleCheckout} 
                                disabled={isProcessing || cart.length === 0} 
                                className="w-full h-16 bg-[#2A2623] hover:bg-black text-lg font-bold shadow-lg transition-all active:scale-[0.98] rounded-xl uppercase tracking-widest"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-3"><Loader2 className="animate-spin" /> Authorizing...</span>
                                ) : (
                                    <span className="flex items-center gap-3"><Lock size={20} strokeWidth={2.5} /> Secure Checkout</span>
                                )}
                            </Button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground opacity-50">
                                <CreditCard size={14} />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Razorpay Secure Gateway</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}