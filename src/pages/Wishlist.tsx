import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getAssetUrl } from '@/api/apiClient';
import { getWishlist, removeFromWishlist, type WishlistItem } from '@/api/wishlistApi'; 
import { addToCart } from '@/api/cartApi';
import { useToast } from '@/hooks/use-toast';

const Wishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist();
      setItems(data);
    } catch (error) {
      console.error('Wishlist sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (designId: number) => {
    try {
      await removeFromWishlist(designId);
      setItems(prev => prev.filter(item => item.designId !== designId));
      toast({ title: "Removed", description: "Design removed from wishlist." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update wishlist." });
    }
  };

  const handleMoveToCart = async (designId: number, title: string) => {
    try {
      await addToCart(designId, 1);
      toast({ title: "Added to Cart", description: `${title} is now in your bag.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error", description: "Please login to add items." });
    }
  };

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
          <div className="mb-12">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">Your Account</span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium mt-2">Wishlist</h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-background border border-dashed rounded-lg">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-serif text-xl mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Save designs you love for later.</p>
              <Button asChild><Link to="/gallery">Browse Designs</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => (
                /* ✅ FIXED: Unique key prop added */
                <div key={item.designId} className="group bg-background border border-border animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Link to={`/product/${item.designId}`} className="block h-full">
                      <img
                        src={getAssetUrl(item.assetUuid)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <button 
                      className="absolute top-3 right-3 w-8 h-8 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shadow-sm"
                      onClick={() => handleRemove(item.designId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Link to={`/product/${item.designId}`}>
                      <h3 className="font-serif text-base group-hover:text-muted-foreground transition-colors truncate">{item.title}</h3>
                    </Link>
                    <p className="text-sm font-medium mt-1">₹{(item.finalPriceCents / 100).toLocaleString('en-IN')}</p>
                    <Button size="sm" className="w-full mt-3 gap-2" onClick={() => handleMoveToCart(item.designId, item.title)}>
                      <ShoppingBag className="h-4 w-4" /> Add to Cart
                    </Button>
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

export default Wishlist;