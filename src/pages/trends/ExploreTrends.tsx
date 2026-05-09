import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Loader2, 
  ShoppingBag, 
  ArrowRight, 
  Plus,
  ArrowUpRight
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';
import { formatPrice } from '@/utils/price';
import trendingBanner from "@/assets/trending-banner.png";

const ExploreTrends = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      // Fetching a single batch to slice for different curated sections
      const response: any = await getDesigns({ trending: true, size: 12, sortBy: 'createdAt,desc' });
      const data = response?.content || (Array.isArray(response) ? response : []);
      setProducts(data);

      const statusEntries = await Promise.all(
        data.map(async (p: Design) => [p.id, await checkWishlistStatus(p.id)])
      );
      setWishlistState(Object.fromEntries(statusEntries));
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    const isWished = wishlistState[product.id];
    try {
      isWished ? await removeFromWishlist(product.id) : await addToWishlist(product.id);
      setWishlistState(prev => ({ ...prev, [product.id]: !isWished }));
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-200" />
        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-neutral-400">Curating Trends</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2A2623] selection:bg-neutral-100">
      <Header />
      
      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="relative h-[85vh] w-full overflow-hidden">
          <img src={trendingBanner} alt="Trending Textile Designs" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center">
            <div className="container mx-auto px-6 md:px-12">
              <div className="max-w-2xl text-white">
                <span className="text-[10px] uppercase tracking-[0.6em] text-white/80 font-bold mb-6 block">Season 2026 Edit</span>
                <h1 className="font-serif text-6xl md:text-8xl font-light mb-8 leading-[1.1] tracking-tight">The Trend <br />Report</h1>
                <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-md mb-12">
                  An curated intelligence of the most influential patterns making waves in the global textile industry.
                </p>
                <div className="flex gap-6">
                  <Link to="/trends/shop" className="px-12 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-neutral-200 transition-all">
                    Explore Shop
                  </Link>
                  <Link to="/trends/shop" className="px-12 py-5 border border-white/40 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION: RECENT TRENDING (Fresh Content) --- */}
        <section className="py-32 bg-white">
          <div className="container px-6 mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-2 block">Newest Arrivals</span>
                <h2 className="font-serif text-4xl md:text-5xl font-light">Recently Noticed</h2>
              </div>
              <Link to="/trends/shop" className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:opacity-60 transition-opacity">
                View All Trends &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products.slice(0, 4).map((product) => (
                <Link key={product.id} to={getProductPath(product)} className="group space-y-6">
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-50 relative">
                     <img src={getAssetUrl(product.assetUuid)} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" alt={product.title} />
                  </div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-lg text-neutral-800">{product.title}</h3>
                    <Plus size={16} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION: CATEGORY NAVIGATION --- */}
        <section className="py-24 bg-[#FBFAF9] border-y border-neutral-100">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-16">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-2 block">Market Direction</span>
              <h2 className="font-serif text-4xl">Browse by Segment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Menswear', 'Womenswear', 'Kidswear', 'Home Interior'].map((category) => (
                <button 
                  key={category}
                  onClick={() => navigate('/trends/shop')}
                  className="h-40 bg-white border border-neutral-100 flex flex-col items-center justify-center gap-4 hover:bg-[#2A2623] hover:text-white transition-all group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{category}</span>
                  <div className="h-px w-6 bg-neutral-200 group-hover:w-12 group-hover:bg-white transition-all" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION: BEST SELLING (High Emphasis) --- */}
        <section className="py-32 bg-white">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col items-center text-center mb-20">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-2 block">Global Demand</span>
              <h2 className="font-serif text-4xl md:text-6xl font-light">Most Acquired</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
              {products.slice(4, 7).map((product) => (
                <div key={product.id} className="flex flex-col">
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 mb-8 group">
                    <img src={getAssetUrl(product.assetUuid)} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={product.title} />
                    <button 
                      onClick={(e) => toggleWishlist(e, product)}
                      className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-black hover:text-white transition-colors"
                    >
                      <Heart size={14} className={wishlistState[product.id] ? "fill-current" : ""} />
                    </button>
                    <div className="absolute top-6 left-6">
                      <span className="bg-black text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1.5">Best Seller</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">{product.segment?.replace('_', ' ')}</p>
                      <h3 className="font-serif text-2xl">{product.title}</h3>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(product.finalPriceCents)}</p>
                  </div>
                  <Link to={getProductPath(product)} className="mt-8 flex items-center justify-center gap-3 py-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                    View Details <ArrowUpRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- EDITORIAL STRIP --- */}
        <section className="relative h-[60vh] bg-black overflow-hidden flex items-center">
           <img 
            src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" 
            alt="Editorial Background" 
          />
          <div className="container px-6 mx-auto relative z-10 text-center">
            <div className="max-w-2xl mx-auto text-white">
              <h2 className="font-serif text-4xl md:text-6xl mb-8 font-light italic leading-tight">Setting the Standard for Premium Textiles</h2>
              <Link to="/trends/shop" className="inline-flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.4em] border-b border-white pb-2 hover:opacity-60 transition-opacity">
                Discover the Collection <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* --- FINAL CTA SECTION --- */}
        <section className="py-40 bg-[#2A2623] text-white">
          <div className="container px-6 mx-auto flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.6em] text-neutral-500 mb-8 font-bold">The Archive</span>
            <h2 className="font-serif text-5xl md:text-7xl mb-12 font-light text-center">Explore the Full <br />Trending Collection</h2>
            <Link 
              to="/trends/shop" 
              className="group px-20 py-6 bg-white text-black text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-neutral-200 transition-all flex items-center gap-4"
            >
              Enter Shop <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreTrends;
