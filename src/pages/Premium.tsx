import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { checkWishlistStatus, addToWishlist, removeFromWishlist } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const Premium = () => {
  const [premiumProducts, setPremiumProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchPremiumData = async () => {
      try {
        // Fetch a larger limit to ensure we have enough items to sort properly
        const response = await getDesigns({ premium: true, limit: 24 });
        const items = Array.isArray(response) ? response : (response.content || []);
        
        // ✅ 1. Filter Premium -> 2. Sort Recent (ID Desc)
        const sortedPremium = items
          .filter((item: Design) => item.premium === true)
          .sort((a, b) => b.id - a.id); // Newest First

        setPremiumProducts(sortedPremium);

        const statusMap: Record<number, boolean> = {};
        for (const item of sortedPremium) {
          statusMap[item.id] = await checkWishlistStatus(item.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync premium collection:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPremiumData();
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
      toast({ title: isWished ? "Removed" : "Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Authentication required." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#1a1a1a]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#c9a96e]" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1 bg-[#1a1a1a]">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Exclusive Collection
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-white tracking-tight">
              Luxury Patterns
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              High-value textile patterns crafted for luxury brands. 
            </p>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 md:px-8">
            {premiumProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40 font-medium uppercase tracking-widest text-xs">No premium designs available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {premiumProducts.map((product) => (
                  <div key={product.id} className="group relative bg-[#252525] rounded-sm overflow-hidden border border-white/5 hover:border-[#c9a96e]/30 transition-colors duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-[#c9a96e] text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider shadow-xl">
                        Premium
                      </span>
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      className={`absolute top-4 right-4 z-20 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg ${
                          wishlistState[product.id] ? 'bg-[#c9a96e] text-[#1a1a1a]' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                    </button>

                    <Link to={`/product/${product.id}`} className="block relative">
                      <div className="aspect-[3/4] overflow-hidden select-none">
                        
                        {/* HIGH-VISIBILITY INDUSTRIAL WATERMARK OVERLAY */}
                        <div 
                          className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='20' font-weight='900' fill='none' stroke='white' stroke-width='0.8' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat'
                          }}
                        />

                        <img
                          src={getAssetUrl(product.assetUuid)}
                          alt={product.title}
                          draggable={false}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-10">
                        <span className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#1a1a1a] text-xs font-bold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-2xl">
                          <Eye className="h-4 w-4" />
                          View Design
                        </span>
                      </div>
                    </Link>

                    <div className="p-8">
                      <h3 className="font-serif text-2xl text-white mb-2 line-clamp-1 group-hover:text-[#c9a96e] transition-colors">{product.title}</h3>
                      <p className="text-white/40 text-sm mb-6 line-clamp-2 leading-relaxed">{product.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="font-serif text-2xl text-[#c9a96e] font-bold">
                          ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Exclusive License</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Premium;