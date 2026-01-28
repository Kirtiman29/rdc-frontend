// src/pages/Premium.tsx
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

  useEffect(() => {
    const fetchPremiumData = async () => {
      try {
        const response = await getDesigns({ premium: true, limit: 12 });
        
        // ✅ FIXED: Support both Page object (response.content) and raw Array
        const items = Array.isArray(response) ? response : (response.content || []);
        
        setPremiumProducts(items);

        // Check wishlist status for authenticated users
        const statusMap: Record<number, boolean> = {};
        for (const item of items) {
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[#1a1a1a]">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Exclusive Collection
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-white">
              Premium Designs
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              High-value textile patterns crafted for luxury brands. 
            </p>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 md:px-8">
            {/* ✅ FIXED: Added empty state check */}
            {premiumProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40">No premium designs available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {premiumProducts.map((product) => (
                  <div key={product.id} className="group relative bg-[#252525] rounded-sm overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-[#c9a96e] text-[#1a1a1a] text-xs font-medium uppercase tracking-wider">
                        Premium
                      </span>
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      className={`absolute top-4 right-4 z-10 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all ${
                          wishlistState[product.id] ? 'bg-[#c9a96e] text-[#1a1a1a]' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                    </button>

                    <Link to={`/product/${product.id}`} className="block">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src={getAssetUrl(product.assetUuid)}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1a1a1a] text-sm font-medium uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <Eye className="h-4 w-4" />
                          View Design
                        </span>
                      </div>
                    </Link>

                    <div className="p-6">
                      <h3 className="font-serif text-xl text-white mb-2 line-clamp-1">{product.title}</h3>
                      <p className="text-white/50 text-sm mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-2xl text-[#c9a96e]">
                          ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-white/40 uppercase tracking-wider">Exclusive License</span>
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