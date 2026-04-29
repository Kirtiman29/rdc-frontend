import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Loader2, Package } from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getToken } from '@/api/apiClient';
import { downloadInvoicePdf, getMyOrders } from '@/api/orderApi';
import type { OrderResponse } from '@/types/order';
import { formatPrice } from '@/utils/price';

const getStatusStyles = (status: string = '') => {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'bg-green-50 text-green-600 border-green-100';
    case 'CANCELLED':
      return 'bg-red-50 text-red-600 border-red-100';
    default:
      return 'bg-amber-50 text-amber-600 border-amber-100';
  }
};

const formatOrderDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const getItemSummary = (order: OrderResponse) => {
  if (!order.items.length) {
    return 'No items found';
  }

  const names = order.items.slice(0, 2).map((item) => item.designTitle).join(', ');
  const remaining = order.items.length - 2;

  return remaining > 0 ? `${names} +${remaining} more` : names;
};

const Orders = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
        const data = await getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load order history:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

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
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 md:px-12 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">Your Account</p>
              <h1 className="font-serif text-4xl text-[#2A2623]">My Purchases</h1>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-32 bg-white border border-dashed rounded-xl shadow-sm">
                <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h2 className="font-serif text-xl">No purchases found</h2>
                <p className="text-muted-foreground text-sm mt-2">Your purchase history is currently empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="group bg-white border border-border/60 hover:border-[#2A2623]/30 p-6 md:p-8 transition-all duration-300 rounded-xl shadow-sm"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Order ORD-{order.id.toString().padStart(3, '0')}
                          </p>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border rounded-full transition-colors ${getStatusStyles(order.status)}`}>
                            {order.status}
                          </span>
                        </div>

                        <div>
                          <h2 className="font-serif text-2xl text-[#2A2623]">
                            {order.customerName || 'My Purchase'}
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {getItemSummary(order)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <span>Purchased {formatOrderDate(order.createdAt)}</span>
                          <span>{order.purchaseType || 'ORDER'}</span>
                          <span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 border-t pt-4 md:items-end md:border-0 md:pt-0">
                        <p className="text-2xl font-bold text-[#2A2623]">
                          {formatPrice(order.grandTotalCents)}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          {order.status.toUpperCase() === 'PAID' && (
                            <button
                              onClick={() => void downloadInvoicePdf(order.id)}
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-[#2A2623] transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Invoice
                            </button>
                          )}

                          <Link
                            to={`/orders/${order.id}`}
                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#2A2623] hover:opacity-70 transition-opacity"
                          >
                            View Details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
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
