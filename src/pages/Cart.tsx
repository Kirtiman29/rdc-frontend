//src/pages/Cart.tsx
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getCart, removeCartItem, CartSummary } from '@/api/cartApi';
import { getAssetUrl } from '@/api/apiClient';
import { useToast } from '@/hooks/use-toast';
// ✅ Import the utility
import { formatPrice } from '@/utils/price';

const Cart = () => {
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

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

  const items = useMemo(() => 
    Array.isArray(cartData?.items) ? cartData.items : [], 
    [cartData]
  );

  const handleRemove = async (itemId: number) => {
    try {
      await removeCartItem(itemId);
      await fetchCartState();
      toast({ title: "Item removed", description: "Cart updated successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not remove item." });
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#2A2623]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" onContextMenu={handleContextMenu}>
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
              <Button asChild className="bg-[#2A2623] hover:bg-black">
                <Link to="/gallery">Browse Designs</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background border border-border p-6 flex gap-6 animate-fade-in shadow-sm rounded-sm"
                  >
                    <Link 
                      to={`/product/${item.designId}`} 
                      className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-secondary/30 select-none"
                    >
                      <div 
                        className="absolute inset-0 z-10 pointer-events-none opacity-[0.20]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='6' font-weight='900' fill='none' stroke='white' stroke-width='0.2' text-anchor='middle' transform='rotate(-35 20 20)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                          backgroundRepeat: 'repeat'
                        }}
                      />

                      <img
                        src={item.assetUuid ? getAssetUrl(item.assetUuid) : '/placeholder.png'}
                        alt={item.designTitle}
                        draggable={false}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <Link to={`/product/${item.designId}`}>
                          <h3 className="font-serif text-lg hover:text-muted-foreground transition-colors truncate">
                            {item.designTitle}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Industrial Design Asset (Quantity: {item.quantity ?? 1})
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {/* ✅ Used formatPrice for item price */}
                          {formatPrice(item.priceCents ?? 0)}
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

              <div className="lg:col-span-1">
                <div className="bg-background border border-border p-6 sticky top-24 shadow-sm rounded-sm">
                  <h2 className="font-serif text-xl mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 pb-6 border-b border-border text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      {/* ✅ Used formatPrice for subtotal */}
                      <span>{formatPrice(cartData?.subtotalCents ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="text-xs italic">Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-6 border-b border-border">
                    <span className="font-medium">Total</span>
                    {/* ✅ Used formatPrice for total */}
                    <span className="font-serif text-xl">{formatPrice(cartData?.subtotalCents ?? 0)}</span>
                    <p className="text-xs italic text-muted-foreground">Taxes calculated at checkout</p>
                  </div>

                  <Button 
                    className="w-full h-12 bg-[#2A2623] hover:bg-black mt-6 uppercase text-xs font-bold tracking-[0.1em]" 
                    size="lg" 
                    onClick={handleCheckout}
                  >
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