//src/components/home/SpecialOffers.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Loader2, Eye } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
// ✅ Import the utility
import { formatPrice } from '@/utils/price';

const SpecialOffers = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response: any = await getDesigns({ size: 50, specialOffer: true }); 
        const rawData = response?.content || (Array.isArray(response) ? response : []);
        
        const filteredOffers = [...rawData]
          .filter((product: Design) => product.specialOffer === true)
          .sort(
            (a: Design, b: Design) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 4); 

        setProducts(filteredOffers);

        const token = localStorage.getItem("accessToken");
        if (token) {
          const statusEntries = await Promise.all(
            filteredOffers.map(async (product: Design) => {
              const isWished = await checkWishlistStatus(product.id);
              return [product.id, isWished];
            })
          );
          setWishlistState(Object.fromEntries(statusEntries));
        }

      } catch (error) {
        console.error('Failed to sync special offers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("accessToken");

    if (!token) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Redirecting to login..."
      });
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    try {
      await addToCart(product.id, 1);
      toast({ 
        title: "Added to Cart", 
        description: `${product.title} is now in your bag.` 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Cart Error", 
        description: "Something went wrong." 
      });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("accessToken");

    if (!token) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Redirecting to login..."
      });
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    const isWished = wishlistState[product.id];

    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setWishlistState(prev => ({ ...prev, [product.id]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Wishlist Error" });
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center h-96 bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-destructive" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-10 md:py-10 bg-secondary/20 font-sans" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-destructive">
              Limited Time
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold mt-2 text-[#2A2623]">
              Special Offers
            </h2>
          </div>
          <Link 
            to="/gallery" 
            className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-1 hidden md:block"
          >
            View All Offers
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <div key={product.id} className="group animate-fade-in">
              <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4 select-none rounded-sm">
                <div 
                  className="absolute inset-0 z-10 pointer-events-none opacity-[0.22]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='18' font-weight='900' fill='none' stroke='white' stroke-width='0.8' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                  }}
                />

                <img
                  src={getAssetUrl(
                    product.media?.find(m => m.role === "COVER")?.url || product.assetUuid
                  )}
                  alt={product.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                <div className="absolute top-4 left-4 z-20">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-destructive text-white px-3 py-1.5 shadow-sm">
                    {product.discountPercent}% OFF
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                  <button 
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
                      wishlistState[product.id] ? 'bg-destructive text-white' : 'bg-white text-[#2A2623] hover:bg-slate-50'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  <div className="w-9 h-9 bg-white text-[#2A2623] rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-all">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>

                <button 
                  className="absolute bottom-4 left-4 right-4 h-10 bg-[#2A2623] text-white rounded-sm flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black z-20 shadow-lg"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </button>

                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
              </Link>

              <div className="space-y-1 px-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-sans text-lg font-medium text-[#2A2623] group-hover:text-muted-foreground transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 font-sans">
                  {/* ✅ Replaced decimal logic with formatPrice utility */}
                  <span className="font-bold text-destructive">
                    {formatPrice(product.finalPriceCents)}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-xs text-muted-foreground line-through font-light">
                      {formatPrice(product.basePriceCents)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;