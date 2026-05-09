import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Loader2, 
  ArrowRight, 
  Tag,
  ArrowUpRight,
  ChevronRight,
  Eye
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';
import { formatPrice } from '@/utils/price';
import specialOfferBanner from "@/assets/special-offer-banner.png";

const ExploreOffers = () => {
  const [offers, setOffers] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchOffersData = useCallback(async () => {
    try {
      // Fetching curated special offers
      const response: any = await getDesigns({ specialOffer: true, size: 12, sortBy: 'createdAt,desc' });
      const data = response?.content || (Array.isArray(response) ? response : []);
      
      setOffers(data);

      const statusEntries = await Promise.all(
        data.map(async (p: Design) => [p.id, await checkWishlistStatus(p.id)])
      );
      setWishlistState(Object.fromEntries(statusEntries));
    } catch (error) {
      console.error('Offers sync failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffersData(); }, [fetchOffersData]);

  const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    const isWished = wishlistState[productId];
    try {
      isWished ? await removeFromWishlist(productId) : await addToWishlist(productId);
      setWishlistState(prev => ({ ...prev, [productId]: !isWished }));
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFAF9]">
        <Loader2 className="h-6 w-6 animate-spin text-[#2A2623]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFAF9] text-[#2A2623] selection:bg-[#2A2623] selection:text-white">
      <Header />
      
      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="relative h-[80vh] w-full overflow-hidden">
          <img src={specialOfferBanner} alt="Special Offers" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center">
            <div className="container mx-auto px-6 md:px-12">
              <div className="max-w-2xl text-white">
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6 block text-[#D22C2C]">Exclusive Opportunity</span>
                <h1 className="font-serif text-5xl md:text-8xl font-light mb-8 leading-tight">Privileged <br />Pricing</h1>
                <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed max-w-md mb-12">
                  Exceptional archival designs and seasonal repeats, now available with exclusive studio savings.
                </p>
                <div className="flex gap-4">
                  <Link to="/special-offers/shop" className="px-10 py-4 bg-[#2A2623] text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all">
                    Explore Offers
                  </Link>
                  <Link to="/special-offers/shop" className="px-10 py-4 border border-white/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#2A2623] transition-all">
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION: LATEST ADDITIONS (FRESH OFFERS) --- */}
        <section className="py-24">
          <div className="container px-6 mx-auto">
            <div className="flex justify-between items-baseline mb-12 border-b border-[#2A2623]/10 pb-6">
              <h2 className="font-serif text-3xl font-light">New in the Collection</h2>
              <Link to="/special-offers/shop" className="group flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                Explore All Offers <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
              {offers.slice(0, 4).map((product) => (
                <OfferCard key={product.id} product={product} toggleWishlist={toggleWishlist} wishlistState={wishlistState} />
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION: CATEGORY QUICK NAV --- */}
        <section className="py-24 bg-[#FBFAF9] border-y border-neutral-100">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-16">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-2 block">Curated Segments</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Menswear', 'Womenswear', 'Kidswear', 'Interior'].map((category) => (
                <button 
                  key={category}
                  onClick={() => navigate(`/special-offers/shop?segment=${category.toUpperCase()}&specialOffer=true`)}
                  className="h-40 bg-white border border-neutral-100 flex flex-col items-center justify-center gap-4 hover:bg-[#2A2623] hover:text-white transition-all group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{category}</span>
                  <div className="h-px w-6 bg-neutral-200 group-hover:w-12 group-hover:bg-white transition-all" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION: FEATURED SAVINGS (BIG CARDS) --- */}
        <section className="py-32">
          <div className="container px-6 mx-auto">
            <div className="max-w-xl mb-20">
              <span className="text-[9px] uppercase tracking-[0.4em] text-[#D22C2C] font-bold mb-4 block">Limited Collection</span>
              <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight text-[#2A2623]">Significant patterns, <br />thoughtfully priced.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {offers.slice(4, 7).map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  <div className="relative aspect-[4/5] overflow-hidden bg-white mb-6">
                    <img 
                      src={getAssetUrl(product.assetUuid)} 
                      className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
                      alt={product.title} 
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-[#D22C2C] text-white text-[7px] font-bold uppercase tracking-widest px-2 py-1 w-fit">
                        {product.discountPercent}% Savings
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-[#2A2623]/5 pt-4">
                    <div>
                      <h3 className="font-serif text-xl mb-1">{product.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#D22C2C]">{formatPrice(product.finalPriceCents)}</span>
                        <span className="text-[10px] text-neutral-400 line-through font-light">{formatPrice(product.basePriceCents)}</span>
                      </div>
                    </div>
                  </div>
                  <Link to={getProductPath(product)} className="mt-6 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Acquire for Production <ArrowUpRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- EDITORIAL BANNER --- */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[#2A2623] opacity-5" />
          <div className="container px-6 relative z-10">
            <Tag size={32} className="mx-auto mb-8 text-[#D22C2C] opacity-50" strokeWidth={1} />
            <h2 className="font-serif text-4xl md:text-6xl font-light italic text-[#2A2623] mb-8">Quality Uncompromised.</h2>
            <p className="max-w-md mx-auto text-neutral-500 font-light mb-10">All special offer designs include the same high-resolution 4K source files and full commercial licensing as our main collection.</p>
            <Link to="/special-offers/shop" className="inline-block px-12 py-5 bg-[#2A2623] text-[#FBFAF9] text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-all">
              View All Offers
            </Link>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-40 bg-[#FBFAF9] border-t border-[#2A2623]/10">
          <div className="container px-6 mx-auto text-center">
            <h2 className="font-serif text-5xl md:text-7xl font-light mb-12 tracking-tight">Expand Your Portfolio</h2>
            <button 
              onClick={() => navigate('/special-offers/shop')}
              className="group inline-flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.5em] border-b border-[#2A2623] pb-2 hover:opacity-60 transition-all"
            >
              Enter Full Offer Gallery <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// --- ELEGANT OFFER CARD ---
const OfferCard = ({ product, toggleWishlist, wishlistState }: { product: Design, toggleWishlist: any, wishlistState: any }) => (
  <div className="group block">
    <div className="aspect-[3/4] overflow-hidden bg-white mb-4 relative">
      <Link to={getProductPath(product)}>
        <img 
          src={getAssetUrl(product.assetUuid)} 
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
          alt={product.title} 
        />
      </Link>
      
      {/* Absolute Overlays */}
      <div className="absolute top-3 left-3">
        <span className="bg-[#D22C2C] text-white text-[7px] font-bold uppercase tracking-widest px-2 py-1">
          -{product.discountPercent}%
        </span>
      </div>
      
      <button 
        onClick={(e) => toggleWishlist(e, product.id)}
        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <Heart size={12} className={wishlistState[product.id] ? "fill-current" : ""} />
      </button>

      <Link to={getProductPath(product)} className="absolute inset-0 bg-[#2A2623]/0 group-hover:bg-[#2A2623]/5 transition-colors duration-700" />
    </div>
    
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="font-serif text-base text-[#2A2623] leading-tight">{product.title}</h3>
        <div className="flex gap-2 items-center">
          <span className="text-[11px] font-bold text-[#D22C2C]">{formatPrice(product.finalPriceCents)}</span>
          <span className="text-[9px] text-neutral-300 line-through">{formatPrice(product.basePriceCents)}</span>
        </div>
      </div>
      <Link to={getProductPath(product)} className="p-1 hover:text-[#D22C2C] transition-colors">
        <Eye size={14} strokeWidth={1.5} />
      </Link>
    </div>
  </div>
);

export default ExploreOffers;
