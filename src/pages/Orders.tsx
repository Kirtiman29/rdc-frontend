import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Package, Loader2 } from 'lucide-react';
import { getAssetUrl } from '@/api/apiClient';
import { getToken } from '@/api/apiClient';
// Assuming you have an orderApi or use the designApi for history
import axios from 'axios'; 

interface OrderItem {
  orderId: string;
  createdAt: string;
  status: string;
  designTitle: string;
  assetUuid: string;
  amountCents: number;
}

const Orders = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Industrial Sync: Fetching from Order Service (Port 8095)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        // Replace with your actual API utility call: e.g., orderApi.get('/history')
        const response = await axios.get('http://localhost:8095/api/orders/history', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to sync order history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Page Header */}
          <div className="mb-12">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Your Account
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Order History
            </h1>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 bg-background border border-dashed rounded-lg">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-serif text-xl mb-2">No orders yet</h2>
              <p className="text-muted-foreground">
                Your purchased designs will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-background border border-border p-6 flex flex-col md:flex-row gap-6 animate-fade-in"
                >
                  {/* Thumbnail resolved via Asset Service (Port 8090) */}
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-secondary/30">
                    <img
                      src={getAssetUrl(order.assetUuid)}
                      alt={order.designTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg">{order.designTitle}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Order #{order.orderId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Purchased on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Industrial Price Rendering (Cents to Currency) */}
                      <span className="text-sm font-medium">
                        ₹{(order.amountCents / 100).toLocaleString('en-IN')}
                      </span>
                      <span className={`text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full ${
                        order.status === 'DELIVERED' || order.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;