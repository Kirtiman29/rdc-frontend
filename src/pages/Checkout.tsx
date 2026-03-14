//src/pages/Checkout.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createOrder } from '@/api/orderApi'; 
import { processIndustrialPayment } from '@/api/paymentApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatPrice } from '@/utils/price';
import { 
    ShieldCheck, 
    Loader2, 
    ArrowLeft, 
    CreditCard, 
    AlertCircle,
    X,
    CheckCircle2
} from 'lucide-react';
import { useCart } from '@/hooks/useCart'; 
import { useAuth } from '@/hooks/useAuth';
import { getAssetUrl } from '@/api/apiClient';

export const GST_STATE_CODES: Record<string, string> = {
    "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10",
    "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24", "Haryana": "06",
    "Himachal Pradesh": "02", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32",
    "Madhya Pradesh": "23", "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
    "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Punjab": "03",
    "Rajasthan": "08", "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36",
    "Tripura": "16", "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19",
    "Andaman and Nicobar Islands": "35", "Chandigarh": "04", 
    "Dadra and Nagar Haveli and Daman and Diu": "26", "Delhi": "07", 
    "Jammu and Kashmir": "01", "Ladakh": "38", "Lakshadweep": "31", "Puducherry": "34"
};

export default function Checkout() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { items } = useCart();
    
    const cart = items || []; 
    
    const [step, setStep] = useState<'review' | 'details'>('review');
    
    // Form States
    const [customerName, setCustomerName] = useState(user?.name || '');
    const [customerEmail, setCustomerEmail] = useState(user?.email || '');
    const [customerPhone, setCustomerPhone] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [addressOne, setAddressOne] = useState('');
    const [addressTwo, setAddressTwo] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [billingState, setBillingState] = useState('');
    const [hasGstin, setHasGstin] = useState(false); 
    const [customerGstin, setCustomerGstin] = useState('');
    
    // Status States
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpeningGateway, setIsOpeningGateway] = useState(false); 
    const [isVerifyingSuccess, setIsVerifyingSuccess] = useState(false); 
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const grandTotal = useMemo(() => 
    cart.reduce((sum, item) => {
        return sum + (item.priceCents * item.quantity);
    }, 0),
[cart]);

    const taxableSubtotal = useMemo(
  () => Math.floor(grandTotal / 1.18),
  [grandTotal]
);

const gstAmount = useMemo(
  () => grandTotal - taxableSubtotal,
  [grandTotal, taxableSubtotal]
);

    // GST Auto-prefix logic
    useEffect(() => {
        if (hasGstin && billingState) {
            const stateCode = GST_STATE_CODES[billingState];
            if (stateCode) {
                setCustomerGstin(prev => {
                    const suffix = prev.length >= 2 ? prev.slice(2) : "";
                    return stateCode + suffix;
                });
            }
        }
    }, [billingState, hasGstin]);

    useEffect(() => {
        if (errorMsg) {
            const timer = setTimeout(() => setErrorMsg(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [errorMsg]);

    useEffect(() => {
        if (searchParams.get('orderId')) {
            setIsVerifyingSuccess(true);
        }
        if (!(window as any).Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, [searchParams]);

    const handleError = (msg: string) => {
        setErrorMsg(msg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCheckout = async () => {
        if (cart.length === 0 || isProcessing || isOpeningGateway) return;

        if (step === 'review') {
            setStep('details');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!customerName.trim()) return handleError("Full name is required.");
        if (!customerEmail.trim()) return handleError("Email address is required.");
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) return handleError("Please enter a valid email address.");

        if (!customerPhone || customerPhone.length !== 10) return handleError("Phone number must be 10 digits.");
        if (!addressOne.trim()) return handleError("Street address is required.");
        if (!city.trim()) return handleError("City is required.");
        if (!pincode || pincode.length !== 6) return handleError("Pincode must be 6 digits.");
        if (!billingState) return handleError("Please select your state.");

        if (hasGstin) {
            const gstRegex = /^[0-9]{2}[A-Z0-9]{13}$/;
            if (!gstRegex.test(customerGstin)) return handleError("Invalid GSTIN format.");
        }

        setIsProcessing(true);
        try {
            const orderPayload = {
                userId: Number(user?.id),
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim(),
                customerPhone: customerPhone.trim(),
                organizationName: organizationName.trim(),
                addressOne: addressOne.trim(),
                addressTwo: addressTwo.trim(),
                city: city.trim(),
                pincode: pincode.trim(),
                billingState: billingState.trim(),
                customerGstin: hasGstin ? customerGstin.toUpperCase() : null,
                totalPriceCents: grandTotal,
                items: cart.map(item => ({
                    designId: Number(item.designId),
                    quantity: Number(item.quantity),
                    priceCents: Number(item.priceCents),
                    designTitle: item.designTitle || "Design Item"
                }))
            };

            const response: any = await createOrder(orderPayload);
            const actualOrderId = response?.id || response?.data?.id;

            if (!actualOrderId) throw new Error("Could not initialize order.");
            
            setIsOpeningGateway(true); 

            setTimeout(async () => {
                try {
                    await (processIndustrialPayment as any)(Number(actualOrderId), navigate, {
                        name: customerName,
                        email: customerEmail,
                        onPaymentStart: () => {
                            setIsOpeningGateway(false);
                            setIsProcessing(false);
                        },
                        onPaymentSuccess: () => {
                            setIsVerifyingSuccess(true);
                        }
                    });
                } catch (err) {
                    setIsOpeningGateway(false);
                    setIsProcessing(false);
                    handleError("Payment gateway failed to load.");
                }
            }, 600);

        } catch (error: any) {
            setIsProcessing(false);
            setIsOpeningGateway(false);
            handleError(error.response?.data?.message || "Transaction aborted.");
        }
    };

    if (isOpeningGateway || isVerifyingSuccess) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                    {isVerifyingSuccess && (
                        <CheckCircle2 className="absolute inset-0 m-auto w-8 h-8 text-black animate-pulse" />
                    )}
                </div>
                <h2 className="font-serif text-3xl text-[#1A1A1A] mb-3 tracking-tight">
                    {isVerifyingSuccess ? "Confirming Payment" : "Opening Secure Gateway"}
                </h2>
                <p className="text-sm text-gray-400">
                    {isVerifyingSuccess ? "Finalizing your order records..." : "Preparing transaction window..."}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-white border-b border-gray-100 py-4 sticky top-0 z-50">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <button onClick={() => step === 'details' ? setStep('review') : navigate('/cart')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-black transition-colors">
                        <ArrowLeft size={16} /> {step === 'details' ? 'Review Order' : 'Back to Cart'}
                    </button>
                    <div className="flex items-center gap-2 text-gray-500">
                        <ShieldCheck size={16} />
                        <span className="text-xs">Secure Checkout</span>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-16">
                <div className="max-w-6xl mx-auto">
                    {errorMsg && (
                        <div className="mb-10 flex items-start gap-4 border border-red-100 bg-red-50 text-red-900 p-5 rounded-md animate-in slide-in-from-top-4 duration-500">
                            <AlertCircle size={18} className="text-red-600 shrink-0" />
                            <div className="flex-1 text-sm">
                                <p className="font-semibold">Payment Issue</p>
                                <p className="opacity-80">{errorMsg}</p>
                            </div>
                            <button onClick={() => setErrorMsg(null)}><X size={18} /></button>
                        </div>
                    )}

                    <div className="mb-16">
                        <span className="text-xs text-gray-400">
                            {step === 'review' ? 'Step 1 of 2' : 'Step 2 of 2'}
                        </span>
                        <h1 className="font-serif text-4xl mt-2 text-[#1A1A1A]">
                            {step === 'review' ? 'Review Items' : 'Shipping & Billing'}
                        </h1>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-7 space-y-8">
                            {step === 'review' ? (
                                <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    {cart.map((item) => (
                                        <div key={item.id} className="p-8 flex gap-8 items-center hover:bg-gray-50/50 transition-all group">
                                            <div className="w-24 h-24 bg-[#F9F9F9] border border-gray-100 p-1 overflow-hidden rounded-md">
                                                <img 
                                                    src={getAssetUrl(item.assetUuid)} 
                                                    alt={item.designTitle} 
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" 
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-serif text-xl text-[#1A1A1A]">{item.designTitle}</h3>
                                                <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                                                    <span>Qty {item.quantity}</span>
                                                    <span className="font-medium text-black">{formatPrice(item.priceCents)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-8 bg-white p-8 border border-gray-100 rounded-lg shadow-sm">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
                                            <Input 
                                                value={customerName} 
                                                onChange={(e) => setCustomerName(e.target.value)} 
                                                className="h-11 border-gray-200 rounded-md px-4 focus:ring-1 focus:ring-black" 
                                                placeholder="John Doe" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Email Address *</Label>
                                            <Input 
                                                value={customerEmail} 
                                                onChange={(e) => setCustomerEmail(e.target.value)} 
                                                type="email" 
                                                className="h-11 border-gray-200 rounded-md px-4 focus:ring-1 focus:ring-black" 
                                                placeholder="john@example.com" 
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-sm font-medium text-gray-700">Street Address *</Label>
                                            <Input 
                                                value={addressOne} 
                                                onChange={(e) => setAddressOne(e.target.value)} 
                                                className="h-11 border-gray-200 rounded-md px-4 focus:ring-1 focus:ring-black" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">City *</Label>
                                            <Input 
                                                value={city} 
                                                onChange={(e) => setCity(e.target.value)} 
                                                className="h-11 border-gray-200 rounded-md px-4 focus:ring-1 focus:ring-black" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Pincode *</Label>
                                            <Input 
                                                value={pincode} 
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 6) setPincode(val);
                                                }} 
                                                maxLength={6} 
                                                className="h-11 border-gray-200 rounded-md px-4 focus:ring-1 focus:ring-black" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Phone *</Label>
                                            <Input 
                                                value={customerPhone} 
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 10) setCustomerPhone(val);
                                                }} 
                                                maxLength={10} 
                                                className="h-11 border-gray-200 rounded-md px-4 focus:ring-1 focus:ring-black" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">State *</Label>
                                            <select 
                                                value={billingState} 
                                                onChange={(e)=>setBillingState(e.target.value)} 
                                                className="h-11 border border-gray-200 rounded-md px-4 w-full focus:outline-none focus:ring-1 focus:ring-black bg-white cursor-pointer text-sm"
                                            >
                                                <option value="">Select State</option>
                                                {Object.keys(GST_STATE_CODES).sort().map(state => (<option key={state} value={state}>{state}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-gray-100">
                                        <label className="flex items-center space-x-3 cursor-pointer group w-fit">
                                            <Checkbox checked={hasGstin} onCheckedChange={(checked) => setHasGstin(checked as boolean)} className="border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black" />
                                            <span className="text-sm text-gray-600 group-hover:text-black transition-colors">Registered GST Business</span>
                                        </label>
                                        
                                        {hasGstin && (
                                            <div className="mt-6 space-y-2 animate-in fade-in duration-500 slide-in-from-top-4">
                                                <Label className="text-sm font-medium text-gray-700">GSTIN Identification *</Label>
                                                <Input 
                                                    value={customerGstin} 
                                                    onChange={(e) => {
                                                        let value = e.target.value.toUpperCase();
                                                        if (billingState) {
                                                            const code = GST_STATE_CODES[billingState];
                                                            value = code + value.slice(2);
                                                        }
                                                        setCustomerGstin(value);
                                                    }} 
                                                    maxLength={15} 
                                                    className="h-11 border-gray-200 rounded-md px-4 font-mono tracking-wide focus:ring-1 focus:ring-black" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-5">
                            <div className="bg-white p-8 sticky top-24 border border-gray-100 rounded-lg shadow-sm">
                                <h2 className="font-serif text-2xl mb-8 text-[#1A1A1A]">Summary</h2>
                                <div className="space-y-4 mb-8 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Net Amount</span>
                                        <span className="font-medium">{formatPrice(taxableSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 italic">GST (18% Incl.)</span>
                                        <span className="text-gray-400">{formatPrice(gstAmount)}</span>
                                    </div>
                                    <div className="h-px bg-gray-100 my-6" />
                                    <div className="flex justify-between items-end">
                                        <span className="font-medium text-base">Total Payable</span>
                                        <span className="text-3xl font-bold text-black">{formatPrice(grandTotal)}</span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleCheckout} 
                                    disabled={isProcessing || isOpeningGateway || cart.length === 0} 
                                    className="w-full h-14 bg-black hover:bg-zinc-800 transition-all text-white rounded-md text-sm font-medium active:scale-[0.98]"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-3"><Loader2 className="animate-spin w-4" /> Verifying...</span>
                                    ) : (
                                        step === 'review' ? "Continue to Shipping" : "Initialize Payment"
                                    )}
                                </Button>
                                
                                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 opacity-40 grayscale">
                                    <CreditCard size={16} />
                                    <span className="text-[10px] uppercase tracking-wider font-medium">Secure Payment via Razorpay</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}