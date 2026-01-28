import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getCart, removeCartItem, CartSummary } from '@/api/cartApi';
import { getAssetUrl } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';

const Cart = () => {
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ Industrial Sync: Fetch cart state from Port 8091
  const fetchCartState = async () => {
    try {
      const data = await getCart();
      setCartData(data);
    } catch (error) {
      console.error('Failed to sync cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartState();
  }, []);

  const handleRemove = async (itemId: number) => {
    try {
      // ✅ Persist removal to Cart Service
      await removeCartItem(itemId);
      await fetchCartState(); // Refresh local state
      toast({ title: "Item removed", description: "Cart updated successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not remove item." });
    }
  };

  const handleCheckout = () => {
    // Navigate to industrial checkout flow (Port 8092 Integration)
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = cartData?.items || [];
  const subtotal = (cartData?.subtotalCents || 0) / 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
          <div className="mb-12">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Shopping
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Your Cart
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-background border border-dashed rounded-lg">
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
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background border border-border p-6 flex gap-6 animate-fade-in"
                  >
                    {/* Thumbnail resolved via Asset Service (Port 8090) */}
                    <Link to={`/product/${item.designId}`} className="w-24 h-24 flex-shrink-0 overflow-hidden bg-secondary/30">
                      <img
                        src={getAssetUrl(item.assetUuid)}
                        alt={item.designTitle}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link to={`/product/${item.designId}`}>
                          <h3 className="font-serif text-lg hover:text-muted-foreground transition-colors truncate">
                            {item.designTitle}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Industrial Design Asset (Quantity: {item.quantity})
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          ₹{(item.priceCents / 100).toLocaleString('en-IN')}
                        </span>
                        <button 
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                          onClick={() => handleRemove(item.id)}
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
                <div className="bg-background border border-border p-6 sticky top-24 shadow-sm">
                  <h2 className="font-serif text-xl mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 pb-6 border-b border-border text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-6 border-b border-border">
                    <span className="font-medium">Total</span>
                    <span className="font-serif text-xl">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <Button className="w-full mt-6" size="lg" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4 italic">
                    Designs are delivered via secure asset streaming after payment.
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