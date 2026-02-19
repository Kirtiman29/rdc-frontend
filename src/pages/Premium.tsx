import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { checkWishlistStatus, addToWishlist, removeFromWishlist } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
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
        const response: any = await getDesigns({ premium: true, limit: 24 });
        const items = response?.content || (Array.isArray(response) ? response : []);
        
        const sortedPremium = [...items]
          .filter((item: Design) => item.premium === true)
          .sort((a, b) => b.id - a.id);

        setPremiumProducts(sortedPremium);

        const statusEntries = await Promise.all(
          sortedPremium.map(async (item) => {
            const isWished = await checkWishlistStatus(item.id);
            return [item.id, isWished];
          })
        );
        
        setWishlistState(Object.fromEntries(statusEntries));
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
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#c9a96e]">
              Exclusive Registry
            </span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-medium mt-4 mb-4 text-white tracking-tight uppercase">
              Luxury Patterns
            </h1>
            <p className="text-white/50 text-base max-w-lg mx-auto italic">
              High-value industrial textile patterns curated for the master registry. 
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4 md:px-8">
            {premiumProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40 font-medium uppercase tracking-widest text-xs">No premium registry designs available.</p>
              </div>
            ) : (
              // ✅ GRID FIX: Increased to 4 columns on desktop to reduce card size
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {premiumProducts.map((product) => (
                  <div key={product.id} className="group relative bg-[#252525] rounded-none overflow-hidden border border-white/5 hover:border-[#c9a96e]/30 transition-all duration-500 shadow-lg">
                    
                    {/* Badge & Wishlist - Sized down */}
                    <div className="absolute top-3 left-3 z-20">
                      <span className="px-2 py-1 bg-[#c9a96e] text-[#1a1a1a] text-[9px] font-black uppercase tracking-wider">
                        Premium
                      </span>
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      className={`absolute top-3 right-3 z-20 w-8 h-8 backdrop-blur-md rounded-full flex items-center justify-center transition-all ${
                          wishlistState[product.id] ? 'bg-[#c9a96e] text-[#1a1a1a]' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                    </button>

                    <Link to={`/product/${product.id}`} className="block relative">
                      <div className="aspect-[3/4] overflow-hidden select-none">
                        <div 
                          className="absolute inset-0 z-10 pointer-events-none opacity-[0.15]"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' font-weight='900' fill='none' stroke='white' stroke-width='0.4' text-anchor='middle' transform='rotate(-35 40 40)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat'
                          }}
                        />
                        <img
                          src={getAssetUrl(product.assetUuid)}
                          alt={product.title}
                          draggable={false}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-10">
                        <span className="inline-flex items-center gap-2 px-6 py-2 bg-white text-[#1a1a1a] text-[9px] font-black uppercase tracking-[0.2em]">
                          <Eye className="h-3 w-3" />
                          View Design
                        </span>
                      </div>
                    </Link>

                    {/* ✅ CONTENT FIX: Reduced padding and font sizes */}
                    <div className="p-5">
                      <h3 className="font-serif text-lg text-white mb-1 line-clamp-1 group-hover:text-[#c9a96e] transition-colors italic uppercase tracking-tight">
                        {product.title}
                      </h3>
                      <p className="text-white/40 text-[11px] mb-4 line-clamp-2 leading-relaxed font-light">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="font-serif text-xl text-[#c9a96e] font-bold">
                          ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">
                          Exclusive
                        </span>
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