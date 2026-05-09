// src/pages/luxury/Premium.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { checkWishlistStatus, addToWishlist, removeFromWishlist } from '@/api/wishlistApi';
import { addToCart } from '@/api/cartApi'; // Ensure this API exists
import { useToast } from '@/hooks/use-toast';
import type { Design, ProductFilter } from '@/types/product';
import { formatPrice } from '@/utils/price';
import { LuxuryFilterContent } from '@/components/products/LuxuryFilters';
import { getEntityPath } from '@/utils/routes';

const Premium = () => {
  const [luxuryProducts, setPremiumProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const [filters, setFilters] = useState<ProductFilter>({
    luxury: true,
    sortBy: 'createdAt,desc',
    page: 0,
    size: 24
  });

  useEffect(() => {
    const fetchPremiumData = async () => {
      setLoading(true);
      try {
        const response: any = await getDesigns(filters);
        const items = response?.content || (Array.isArray(response) ? response : []);
        const finalItems = [...items].filter((item: Design) => item.luxury === true);
        setPremiumProducts(finalItems);

        const statusEntries = await Promise.all(
          finalItems.map(async (item) => {
            const isWished = await checkWishlistStatus(item.id);
            return [item.id, isWished];
          })
        );
        setWishlistState(Object.fromEntries(statusEntries));
      } catch (error) {
        console.error('Failed to sync luxury collection:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPremiumData();
  }, [filters]);

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    setAddingToCart(productId);
    try {
      await addToCart(productId, 1);
      window.dispatchEvent(new Event('cart-updated')); // Sync Header cart count
      toast({ title: "Added to Bag", description: "Premium design added successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add to cart." });
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    const isWished = wishlistState[productId];
    try {
      if (isWished) await removeFromWishlist(productId);
      else await addToWishlist(productId);
      setWishlistState(prev => ({ ...prev, [productId]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Auth Required" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111111]">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 md:px-8">
        <div className="py-12 border-b border-white/5 mb-8">
          <h1 className="font-serif text-4xl text-white tracking-tight uppercase">Luxury Registry</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">Exclusive Master Patterns</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 relative">
          {/* Sidebar - FIXED OVERLAP by using h-[calc(100vh-120px)] */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-10">
              <LuxuryFilterContent filters={filters} onFiltersChange={setFilters} />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 pb-24">
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#c9a96e]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                {luxuryProducts.map((product) => (
                  <div key={product.id} className="group flex flex-col">
                    {/* Professional Image Container */}
                    <div className="relative aspect-[3/4] bg-[#1a1a1a] overflow-hidden">
                      <Link to={getEntityPath('/luxury/design', product)}>
                        <img
                          src={getAssetUrl(product.assetUuid)}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* Add to Cart Overlay (Hover Only) */}
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                           <button 
                            onClick={(e) => handleAddToCart(e, product.id)}
                            disabled={addingToCart === product.id}
                            className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#c9a96e] hover:text-white transition-colors shadow-2xl"
                           >
                             {addingToCart === product.id ? (
                               <Loader2 className="h-3 w-3 animate-spin" />
                             ) : (
                               <>
                                <ShoppingBag className="h-3 w-3" />
                                Add to Bag
                               </>
                             )}
                           </button>
                        </div>
                      </Link>
                      
                      <button
                        onClick={(e) => toggleWishlist(e, product.id)}
                        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-[#c9a96e] transition-all"
                      >
                        <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-[#c9a96e] text-[#c9a96e]' : ''}`} />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-white text-[11px] font-bold uppercase tracking-widest line-clamp-1">
                          {product.title}
                        </h3>
                        <span className="text-[#c9a96e] text-[12px] font-bold tracking-tighter">
                          {formatPrice(product.finalPriceCents)}
                        </span>
                      </div>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider font-medium italic">
                        Premium Selection
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer with background reset to prevent overlap visual issues */}
      <footer className="mt-auto bg-white text-black z-30">
        <Footer />
      </footer>
    </div>
  );
};

export default Premium;
