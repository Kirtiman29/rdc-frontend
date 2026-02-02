import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getTrendingDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const Trends = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const data = await getTrendingDesigns(50); 
        
        // ✅ MANDATORY FIX: Filter strictly for trending designs only
        // ✅ SORT: Ensure newest entries (highest IDs) are shown first
        const filteredAndSorted = data
          .filter((product: Design) => product.trending === true)
          .sort((a, b) => b.id - a.id);
        
        setProducts(filteredAndSorted);

        const statusMap: Record<number, boolean> = {};
        for (const product of filteredAndSorted) {
          statusMap[product.id] = await checkWishlistStatus(product.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync trending collection:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingData();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to Cart", description: `${product.title} added.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error" });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
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
      toast({ variant: "destructive", title: "Error" });
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
    <div className="min-h-screen flex flex-col" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2A2623]">
              What's Hot
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-[#2A2623]">
              Trending Designs
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto italic">
              Discover the patterns making waves in the industry. 
              Curated from our most sought-after designs this season.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-background rounded-sm overflow-hidden border border-border/60 hover:border-[#2A2623]/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 shadow-sm"
                >
                  <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => toggleWishlist(e, product)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
                        wishlistState[product.id] ? 'bg-destructive text-white' : 'bg-white/90 text-[#2A2623]'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                    </button>
                    <Link 
                      to={`/product/${product.id}`}
                      className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#2A2623] hover:bg-white transition-all shadow-md"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>

                  <Link to={`/product/${product.id}`} className="block relative">
                    <div className="aspect-[3/4] overflow-hidden bg-secondary/30 select-none">
                      <div 
                        className="absolute inset-0 z-10 pointer-events-none opacity-[0.22]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' font-weight='900' fill='none' stroke='white' stroke-width='0.7' text-anchor='middle' transform='rotate(-35 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`,
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
                  </Link>

                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        {product.segment?.replace('_', ' ') || 'Textile'}
                      </p>
                      {/* ✅ FIX: Removed 'italic' from title to match editorial style */}
                      <h3 className="font-serif text-lg text-[#2A2623] line-clamp-1 group-hover:text-slate-600 transition-colors">
                        {product.title}
                      </h3>
                      <p className="font-bold text-xl text-[#2A2623] mt-1">
                        ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button 
                      className="w-full h-11 bg-[#2A2623] text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm active:scale-95"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Selection
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-24 border border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 font-medium">No designs are currently trending.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Trends;