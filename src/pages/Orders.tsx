import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Package, Loader2, FileText, Hash } from 'lucide-react'; 
import { getToken } from '@/api/apiClient';
import { getMyOrders, downloadInvoicePdf } from '@/api/orderApi';

interface OrderItem {
  id: number;
  designId: number;
  designIdentifier: string; 
  assetUuid: string;
  designTitle: string;
  quantity: number;
  priceCents: number;
}

interface Order {
  id: number;
  userId: number;
  totalPriceCents: number; 
  status: string; 
  createdAt: string;
  items?: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        /**
         * ✅ PRODUCTION SYNC:
         * getMyOrders returns the array directly because 
         * of the interceptor unwrapper in apiClient.ts.
         */
        const data: any = await getMyOrders(); 
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to sync order history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2A2623]" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 md:px-12 py-16">
          <div className="max-w-5xl mx-auto">
            {/* Header Section Restored */}
            <div className="mb-10 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">Your Account</p>
              <h1 className="font-serif text-4xl text-[#2A2623]">Order History</h1>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-32 bg-white border border-dashed rounded-xl shadow-sm">
                <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h2 className="font-serif text-xl">No assets found</h2>
                <p className="text-muted-foreground text-sm mt-2">Your purchase history is currently empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  order.items?.map((item) => (
                    <div
                      key={`${order.id}-${item.id}`}
                      className="group bg-white border border-border/60 hover:border-[#2A2623]/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300 rounded-xl shadow-sm"
                    >
                      {/* LEFT SIDE: ASSET INFO Restored */}
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        {/* DESIGN ID BOX Restored */}
                        <div className="relative w-24 h-24 bg-secondary/10 flex-shrink-0 flex flex-col items-center justify-center rounded-lg border border-border group-hover:bg-secondary/20 transition-colors">
                           <Hash className="h-4 w-4 text-muted-foreground/40 mb-1" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Design ID</span>
                           <span className="text-[11px] font-mono font-bold text-[#2A2623] px-2 text-center break-all leading-tight">
                             {item.designIdentifier || `ID-${item.designId}`}
                           </span>
                        </div>

                        <div className="text-left space-y-1">
                          <h3 className="font-serif text-2xl text-[#2A2623] leading-tight">{item.designTitle}</h3>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              Order ORD-{order.id.toString().padStart(3, '0')}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Purchased on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT SIDE: PRICE & STATUS Restored */}
                      <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto border-t md:border-0 pt-4 md:pt-0">
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#2A2623]">
                            ₹{(item.priceCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          
                          {order.status.toUpperCase() === 'PAID' && (
                            <button 
                              onClick={() => downloadInvoicePdf(order.id)}
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-[#2A2623] transition-colors mt-1 ml-auto"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Invoice
                            </button>
                          )}
                        </div>

                        <div className="flex items-center">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2 border rounded-full transition-colors ${getStatusStyles(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;