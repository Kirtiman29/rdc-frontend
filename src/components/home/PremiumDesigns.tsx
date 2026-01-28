import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight, ShoppingBag, Eye } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const PremiumDesigns = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const response = await getDesigns({ premium: true });
        const premiumData = Array.isArray(response) ? response : (response.content || []);
        
        // Strictly take the 4 most recent premium designs
        setProducts(premiumData.slice(0, 4));

        const statusMap: Record<number, boolean> = {};
        for (const product of premiumData.slice(0, 4)) {
          statusMap[product.id] = await checkWishlistStatus(product.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync premium designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPremium();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 420; 
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast({ title: "Premium Item Added", description: `${product.title} has been added to your cart.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error" });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault(); e.stopPropagation();
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

  if (products.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-row items-end justify-between mb-16">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-[#c9a962]">
              Exclusive Collection
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-white">
              Premium Designs
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/premium" className="text-neutral-400 hover:text-white transition-colors text-xs font-medium border-b border-neutral-800 pb-1 hidden sm:block">
              View All
            </Link>
            
            <div className="flex items-center gap-2">
              <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex flex-nowrap gap-6 md:gap-10 overflow-x-auto scroll-smooth pb-4 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {products.map((product) => (
            <div key={product.id} className="flex-none w-[300px] sm:w-[340px] md:w-[380px] group">
              <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden mb-6">
                <img
                  src={getAssetUrl(product.assetUuid)}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#c9a962] text-[#1a1a1a] px-3 py-1">
                    Premium
                  </span>
                </div>

                {/* ✅ Action Buttons Overlay (Upper Right) */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                      wishlistState[product.id] ? 'bg-[#c9a962] text-[#1a1a1a]' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>
                  
                  {/* ✅ FIXED: Restored Eye Icon for Quick View */}
                  <Link 
                    to={`/product/${product.id}`}
                    className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>

                <button 
                  className="absolute bottom-4 left-4 right-4 h-10 bg-white text-black text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-[#c9a962] hover:text-white flex items-center justify-center gap-2"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Add to Cart
                </button>
              </div>

              <div className="space-y-2 px-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-xl text-white group-hover:text-[#c9a962] transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <p className="text-lg text-[#c9a962] font-medium">
                  ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
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