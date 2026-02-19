import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';

const SpecialOffers = () => {
  const [offers, setOffers] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        /**
         * ✅ PRODUCTION SYNC:
         * getDesigns returns the unwrapped data object via interceptor.
         */
        const response: any = await getDesigns({ specialOffer: true, limit: 24 });
        const rawItems = response?.content || (Array.isArray(response) ? response : []);
        
        const sortedOffers = [...rawItems]
          .filter((item: Design) => item.specialOffer === true)
          .sort((a, b) => b.id - a.id)
          .slice(0, 12);

        setOffers(sortedOffers);

        /**
         * ✅ PERFORMANCE FIX: Parallel Batch Check
         * Using Promise.all to avoid request waterfalls when checking 
         * statuses across microservice boundaries.
         */
        const statusEntries = await Promise.all(
          sortedOffers.map(async (item) => {
            const isWished = await checkWishlistStatus(item.id);
            return [item.id, isWished];
          })
        );
        
        setWishlistState(Object.fromEntries(statusEntries));
      } catch (error) {
        console.error('Special Offers sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    const isWished = wishlistState[productId];
    try {
      if (isWished) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
      setWishlistState(prev => ({ ...prev, [productId]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved", description: "Wishlist updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Please login to save items." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#2A2623]" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        {/* Banner Section Restored */}
        <section className="py-12 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-rose-600">
              Limited Time
            </span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-medium mt-3 md:mt-4 mb-4 md:mb-6 text-[#2A2623]">
              Special Offers
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto px-4">
              Exceptional designs at exclusive prices. 
              Premium quality patterns with savings that matter.
            </p>
          </div>
        </section>

        {/* Catalog Section Restored */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 lg:gap-8">
              {offers.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-background rounded-sm overflow-hidden border border-border hover:border-[#2A2623]/30 transition-all duration-300 shadow-sm flex flex-col h-full"
                >
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2 py-1 bg-rose-600 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider shadow-md">
                      {product.discountPercent}% Off
                    </span>
                  </div>

                  <button
                    onClick={(e) => toggleWishlist(e, product.id)}
                    className={`absolute top-3 right-3 z-20 w-8 h-8 md:w-9 md:h-9 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg ${
                        wishlistState[product.id] ? 'bg-rose-600 text-white' : 'bg-white/90 text-[#2A2623] hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 md:h-4.5 md:w-4.5 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  <Link to={`/product/${product.id}`} className="block relative flex-shrink-0">
                    <div className="aspect-square overflow-hidden bg-secondary/20 select-none">
                      <div 
                        className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='22' font-weight='900' fill='none' stroke='white' stroke-width='0.8' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                          backgroundRepeat: 'repeat'
                        }}
                      />
                      <img
                        src={getAssetUrl(product.assetUuid)}
                        alt={product.title}
                        draggable={false}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-colors pointer-events-none" />
                    </div>

                    <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 hidden md:flex">
                      <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#2A2623] text-xs font-bold uppercase tracking-widest shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Eye className="h-4 w-4" />
                        Quick View
                      </span>
                    </div>
                  </Link>

                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {product.segment?.replace('_', ' ')}
                    </p>
                    
                    <h3 className="font-serif text-lg md:text-xl text-[#2A2623] mb-2 md:mb-3 truncate group-hover:text-slate-600 transition-colors">
                      {product.title}
                    </h3>
                    
                    <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6 line-clamp-2 leading-relaxed flex-1">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center gap-3 md:gap-4 pt-4 border-t border-slate-50 mt-auto">
                      <span className="font-serif text-xl md:text-2xl text-rose-600 font-bold">
                        ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 line-through text-xs md:text-sm font-medium">
                        ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {offers.length === 0 && (
              <div className="text-center py-16 md:py-24 border border-dashed border-slate-200 rounded-xl px-4">
                <p className="text-slate-400 text-base md:text-lg mb-6 font-medium">
                  No special offers available at the moment.
                </p>
                <Link to="/gallery" className="inline-block px-8 md:px-10 py-3 md:py-4 bg-[#2A2623] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg">
                  Browse All Designs
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SpecialOffers;