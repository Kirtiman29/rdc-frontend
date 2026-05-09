import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { formatPrice } from '@/utils/price';
import { cn } from '@/lib/utils';
import { getProductPath } from '@/utils/routes';

const PremiumDesigns = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const response: any = await getDesigns({ luxury: true, size: 20 });
        const rawData = response?.content || (Array.isArray(response) ? response : []);

        const LuxuryOnly = [...rawData]
          .filter((product: Design) => product.luxury === true)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);

        setProducts(LuxuryOnly);

        const statusEntries = await Promise.all(
          LuxuryOnly.map(async (product: Design) => [product.id, await checkWishlistStatus(product.id)])
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
      const scrollAmount = 450;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
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
      toast({ title: isWished ? "Removed from Archive" : "Saved to Archive" });
    } catch (error) {
      toast({ variant: "destructive", title: "Authentication Required" });
    }
  };

  if (loading) {
    return (
      <div className="py-40 bg-[#0a0a0a] flex justify-center items-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a962]" />
      </div>
    );
  }

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 15% 50%, rgba(201,169,98,0.08), transparent 45%), #0a0a0a`
      }}
    >
      <div className="container mx-auto px-6 md:px-12">
        {/* EDITORIAL HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9a962] block mb-4">
              Exclusive Collection
            </span>
            <h2 className="font-serif text-5xl md:text-6xl text-white mb-6">
              Luxury Patterns
            </h2>
            <p className="text-neutral-500 text-sm md:text-base font-light leading-relaxed max-w-lg italic">
              Designs made for premium collections every pattern built to meet the standard your buyers expect.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/luxury/explore" className="group flex items-center gap-3 text-[#c9a962] text-xs font-bold uppercase tracking-widest mr-4">
              Explore Archive <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
            </Link>
            <div className="flex gap-2">
              <button onClick={() => scroll('left')} className="w-12 h-12 rounded-full border border-[#c9a962]/20 flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                <ChevronLeft className="h-5 w-5 text-[#c9a962]" />
              </button>
              <button onClick={() => scroll('right')} className="w-12 h-12 rounded-full border border-[#c9a962]/20 flex items-center justify-center hover:bg-[#c9a962]/10 transition-all">
                <ChevronRight className="h-5 w-5 text-[#c9a962]" />
              </button>
            </div>
          </div>
        </div>

        {/* EDITORIAL CAROUSEL */}
        <div
          ref={scrollContainerRef}
          className="flex flex-nowrap gap-8 overflow-x-auto snap-x snap-mandatory pb-12 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-[320px] sm:w-[380px] md:w-[420px] snap-start group relative"
            >
              <Link to={getProductPath(product)} className="block relative aspect-[4/5] overflow-hidden">
                {/* Visual Content - No Watermark */}
                <img
                  src={getAssetUrl(product.media?.find(m => m.role === "COVER")?.url || product.assetUuid)}
                  alt={product.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />

                {/* Top Badge & Wishlist */}
                <div className="absolute top-6 left-6 z-20">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-[#c9a962]/90 text-black px-3 py-1 backdrop-blur-sm">
                    Premium
                  </span>
                </div>

                <button
                  onClick={(e) => toggleWishlist(e, product)}
                  className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500"
                >
                  <Heart className={cn("w-4 h-4 text-white", wishlistState[product.id] && "fill-[#c9a962] text-[#c9a962]")} />
                </button>

                {/* Editorial Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col items-start gap-1">
                  <h3 className="font-serif text-2xl text-white group-hover:text-[#c9a962] transition-colors duration-500">
                    {product.title}
                  </h3>
                  <p className="text-[#c9a962] text-sm tracking-widest font-medium">
                    {formatPrice(product.finalPriceCents)}
                  </p>
                </div>

                {/* Subtle Luxury Hover CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 z-30 pointer-events-none">
                  <span className="text-white text-[10px] uppercase tracking-[0.4em] border-b border-white pb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    View Design
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumDesigns;
