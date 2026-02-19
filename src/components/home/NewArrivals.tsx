import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Loader2 } from 'lucide-react';
import { getNewArrivals } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';

const NewArrivals = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        /** * ✅ PRODUCTION SYNC:
         * getNewArrivals returns the data directly from the unified apiClient interceptor.
         */
        const data: any = await getNewArrivals(24);
        
        // Handle potential Pageable response or raw array
        const rawItems = Array.isArray(data) ? data : (data?.content || []);
        
        // ✅ 1. Sort Recent (ID Desc) -> 2. Slice strictly top 8
        const sortedRecent = [...rawItems]
          .sort((a: Design, b: Design) => b.id - a.id)
          .slice(0, 8);

        setProducts(sortedRecent);

        /**
         * ✅ PERFORMANCE FIX: Parallel Status Check
         * Replaced sequential loop with Promise.all to avoid request waterfalls.
         */
        const statusEntries = await Promise.all(
          sortedRecent.map(async (product: Design) => {
            const isWished = await checkWishlistStatus(product.id);
            return [product.id, isWished];
          })
        );
        
        setWishlistState(Object.fromEntries(statusEntries));
      } catch (error) {
        console.error('Failed to sync new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to Cart", description: `${product.title} is now in your bag.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error", description: "Please login to add items." });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    const isWished = wishlistState[product.id];
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setWishlistState(prev => ({ ...prev, [product.id]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved", description: "Your wishlist has been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Wishlist Error", description: "Authentication required." });
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-background" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-12">
          {/* Header Section Restored */}
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Just Arrived
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2 text-[#2A2623]">
              New Arrivals
            </h2>
          </div>
          <Link 
            to="/gallery?newArrival=true" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <div key={product.id} className="group animate-fade-in">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4 select-none rounded-sm">
                  
                  {/* High-Visibility Watermark Overlay */}
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.22]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' font-weight='900' fill='none' stroke='white' stroke-width='0.8' text-anchor='middle' transform='rotate(-35 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />

                  <img
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    draggable={false}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  <div className="absolute top-4 left-4 z-20">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-[#2A2623] text-white px-2 py-1">
                      New
                    </span>
                  </div>

                  <button 
                    className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md z-20 ${
                      wishlistState[product.id] ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  <button 
                    className="absolute bottom-4 left-4 right-4 h-10 bg-[#2A2623] text-white rounded-sm flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black z-20 shadow-lg"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Selection
                  </button>

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                </div>
              </Link>

              <div className="space-y-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-[#2A2623] group-hover:text-muted-foreground transition-colors line-clamp-1 italic">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm font-medium text-slate-600">
                  ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link to="/gallery?newArrival=true" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            View All New Arrivals →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;