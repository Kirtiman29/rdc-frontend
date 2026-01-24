import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Package } from 'lucide-react';

// Mock orders data
const orders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    status: 'Delivered',
    design: {
      name: 'Botanical Whispers',
      image: 'https://images.unsplash.com/photo-1534710961216-75c88202f43e?w=800&q=80',
      price: 49,
    },
  },
  {
    id: 'ORD-002',
    date: '2024-01-10',
    status: 'Delivered',
    design: {
      name: 'Geometric Luxe',
      image: 'https://images.unsplash.com/photo-1509537257950-20f875b03669?w=800&q=80',
      price: 59,
    },
  },
];

const Orders = () => {
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
            <div className="text-center py-20">
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
                  key={order.id}
                  className="bg-background border border-border p-6 flex flex-col md:flex-row gap-6"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-secondary/30">
                    <img
                      src={order.design.image}
                      alt={order.design.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg">{order.design.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Order {order.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Purchased on {new Date(order.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-sm font-medium">${order.design.price}</span>
                      <span className="text-xs font-medium uppercase tracking-wider bg-green-100 text-green-800 px-3 py-1 rounded-full">
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
