//src/components/home/TrendingDesigns.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Loader2 } from 'lucide-react';
import { getTrendingDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { formatPrice } from '@/utils/price';
const TrendingDesigns = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data: any = await getTrendingDesigns(12); 
        const rawItems = Array.isArray(data) ? data : (data?.content || []);

        const filteredTrending = [...rawItems]
          .filter((product: Design) => product.trending === true)
          .sort((a: Design, b: Design) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 9); 

        setProducts(filteredTrending);

        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (token) {
          const statusEntries = await Promise.all(
            filteredTrending.map(async (product: Design) => {
              const isWished = await checkWishlistStatus(product.id);
              return [product.id, isWished];
            })
          );
          setWishlistState(Object.fromEntries(statusEntries));
        }
      } catch (error) {
        console.error('Failed to sync trending designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

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
        title: "Added to Bag", 
        description: `${product.title} has been added to your selection.` 
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

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to save designs."
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
      toast({ 
        title: isWished ? "Removed" : "Saved", 
        description: "Your selection has been updated." 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Wishlist Error" 
      });
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
    <section className="py-20 md:py-24 bg-[#FBFAF9] font-sans" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Subtle Divider */}
        <div className="w-full h-[1px] bg-neutral-200 mb-16" />

        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2A2623] mb-4 block">
              Curated Selection
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#2A2623]">
              Trending Designs
            </h2>
            <p className="text-[#2A2623]/70 mt-4 text-lg">
              Trending designs that match today's consumer taste are selling out fast source now and stay ahead before anyone else does.
            </p>
          </div>
          <div className="hidden md:block pb-2 shrink-0">
            <Link 
              to="/trends/explore" 
              className="text-sm font-bold uppercase tracking-widest text-[#2A2623] hover:text-[#2A2623]/70 transition-colors border-b border-[#2A2623]/30 pb-1"
            >
              Explore Collection →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[260px] md:auto-rows-[300px] gap-6 animate-fade-in">
          {products.map((product, index) => (
            <Link 
              key={product.id}
              to={`/product/${product.id}`} 
              className={`group relative overflow-hidden bg-neutral-100 block ${
                [0, 3, 5].includes(index % 9) ? "row-span-2" : ""
              }`}
            >
              {/* Product Background */}
              <img
                src={getAssetUrl(
                  product.media?.find(m => m.role === "COVER")?.url || product.assetUuid
                )}
                alt={product.title}
                draggable={false}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
              
              {/* Gradient Overlay for Text Readability & Hover Blur Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-90 transition-all duration-700 group-hover:bg-black/30" />

              {/* Top Right Subtle Actions (Wishlist) */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                <button 
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    wishlistState[product.id] ? 'bg-[#2A2623] text-white' : 'bg-white/90 backdrop-blur text-[#2A2623] hover:bg-white'
                  }`}
                  onClick={(e) => toggleWishlist(e, product)}
                >
                  <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Text Content Overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-white z-20 flex flex-col justify-end h-full">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-0 -translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 mb-3">
                  View Design →
                </span>
                <h3 className="font-serif text-2xl drop-shadow-sm leading-tight group-hover:-translate-y-1 transition-transform duration-500">
                  {product.title}
                </h3>
                <p className="text-sm font-medium opacity-80 mt-1.5 group-hover:-translate-y-1 transition-transform duration-500">
                  {formatPrice(product.finalPriceCents || product.basePriceCents)}
                </p>
              </div>
            </Link>
          ))}
        </div>  
      </div>
    </section>
  );
};

export default TrendingDesigns;