import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getFeaturedProducts } from '@/data/products';

const Cart = () => {
  // Mock cart - using featured products as example
  const cartItems = getFeaturedProducts().slice(0, 2).map(product => ({
    product,
    quantity: 1,
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Page Header */}
          <div className="mb-12">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Shopping
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Your Cart
            </h1>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-serif text-xl mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some beautiful designs to get started.
              </p>
              <Button asChild>
                <Link to="/gallery">Browse Designs</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-background border border-border p-6 flex gap-6"
                  >
                    {/* Thumbnail */}
                    <Link to={`/product/${item.product.id}`} className="w-24 h-24 flex-shrink-0 overflow-hidden bg-secondary/30">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-serif text-lg hover:text-muted-foreground transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Digital Pattern (TIFF)
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">${item.product.price}</span>
                        <button 
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => {
                            // Remove from cart logic
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-background border border-border p-6 sticky top-24">
                  <h2 className="font-serif text-xl mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>$0</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-6 border-b border-border">
                    <span className="font-medium">Total</span>
                    <span className="font-serif text-xl">${subtotal}</span>
                  </div>

                  <Button className="w-full mt-6" size="lg">
                    Proceed to Checkout
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Design files will be sent via email after payment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
