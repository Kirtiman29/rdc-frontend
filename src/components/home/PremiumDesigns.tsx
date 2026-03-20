//src/components/home/PremiumDesigns.tsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight, ShoppingBag, Eye } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { formatPrice } from '@/utils/price';

const PremiumDesigns = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const response: any = await getDesigns({
          luxury: true,
          size: 20
        });
        
        const rawData = response?.content || (Array.isArray(response) ? response : []);
        
        const LuxuryOnly = [...rawData]
          .filter((product: Design) => product.luxury === true)
          .sort(
            (a: Design, b: Design) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10);

        setProducts(LuxuryOnly);

        const statusEntries = await Promise.all(
          LuxuryOnly.map(async (product: Design) => {
            const isWished = await checkWishlistStatus(product.id);
            return [product.id, isWished];
          })
        );
        
        setWishlistState(Object.fromEntries(statusEntries));
      } catch (error) {
        console.error('Failed to sync luxury designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPremium();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 420; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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
        title: "Premium Item Added",
        description: `${product.title} added to cart`
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Cart Error"
      });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    const isWished = wishlistState[product.id];
    try {
      if (isWished) { await removeFromWishlist(product.id); } 
      else { await addToWishlist(product.id); }
      setWishlistState(prev => ({ ...prev, [product.id]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Auth Required" });
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-[#0a0a0a] flex justify-center items-center h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#c9a962]" />
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <section className="py-24 bg-[#0a0a0a] text-center text-neutral-500">
        No premium designs available
      </section>
    );
  }

  return (
    <section
      className="py-10 md:py-10 bg-[#0a0a0a] text-white h-fit self-start w-contain"
      onContextMenu={handleContextMenu}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-row items-end justify-between mb-16">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-[#c9a962]">
              Exclusive Collection
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-medium text-white">
              Luxury Patterns
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/gallery"
              className="text-neutral-400 hover:text-white transition-colors text-xs font-medium border-b border-neutral-800 pb-1 hidden sm:block"
            >
              View All
            </Link>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex flex-nowrap gap-6 md:gap-10 overflow-x-auto scroll-smooth pb-4 no-scrollbar items-start"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-none w-[300px] sm:w-[340px] md:w-[380px] group">
              <Link
                to={`/product/${product.id}`}
                className="block relative aspect-[3/4] bg-neutral-900 overflow-hidden mb-6 select-none"
              >
                <div 
                  className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='20' font-weight='900' fill='none' stroke='white' stroke-width='0.7' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
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
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#c9a962] text-[#1a1a1a] px-3 py-1">
                    Premium
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                  <button 
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                      wishlistState[product.id]
                        ? 'bg-[#c9a962] text-[#1a1a1a]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>
                  
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>

                <button 
                  className="absolute bottom-4 left-4 right-4 h-10 bg-white text-black text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-[#c9a962] hover:text-white flex items-center justify-center gap-2 z-20"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Add to Cart
                </button>

                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none" />
              </Link>

              <div className="space-y-2 px-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-sans text-xl text-white group-hover:text-[#c9a962] transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed font-light">
                  {product.description}
                </p>
                <p className="text-lg text-[#c9a962] font-medium tracking-tight">
                  {formatPrice(product.finalPriceCents)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumDesigns;