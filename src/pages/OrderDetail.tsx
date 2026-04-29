import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Package } from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { downloadInvoicePdf, getOrderDetails } from '@/api/orderApi';
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

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Order not found.');
        setLoading(false);
        return;
      }

      try {
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch (loadError) {
        console.error('Failed to load order details:', loadError);
        setError('We could not load this order right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

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

  if (!order || error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-lg w-full rounded-xl border border-dashed bg-white p-10 text-center shadow-sm">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/20" />
            <h1 className="mt-4 font-serif text-2xl text-[#2A2623]">Order unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || 'This order could not be found.'}</p>
            <button
              onClick={() => navigate('/orders')}
              className="mt-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#2A2623]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 md:px-12 py-16">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-[#2A2623] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Orders
                </Link>
                <h1 className="mt-4 font-serif text-4xl text-[#2A2623]">
                  Order ORD-{order.id.toString().padStart(3, '0')}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Purchased on {formatOrderDate(order.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border rounded-full ${getStatusStyles(order.status)}`}>
                  {order.status}
                </span>
                {order.status.toUpperCase() === 'PAID' && (
                  <button
                    onClick={() => void downloadInvoicePdf(order.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623] hover:border-[#2A2623]/30"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Invoice
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Customer</p>
                <p className="mt-3 font-serif text-2xl text-[#2A2623]">{order.customerName || 'RDC Customer'}</p>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Purchase Type</p>
                <p className="mt-3 font-serif text-2xl text-[#2A2623]">{order.purchaseType || 'ORDER'}</p>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Total</p>
                <p className="mt-3 font-serif text-2xl text-[#2A2623]">{formatPrice(order.grandTotalCents)}</p>
              </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <h2 className="font-serif text-2xl text-[#2A2623]">Items</h2>
              </div>

              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-[#2A2623]">{item.designTitle}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{item.designIdentifier || `ID-${item.designId}`}</span>
                        <span>Qty {item.quantity}</span>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm text-muted-foreground">Line Total</p>
                      <p className="font-semibold text-[#2A2623]">{formatPrice(item.totalPriceCents)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
