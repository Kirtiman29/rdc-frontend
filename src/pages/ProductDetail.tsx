import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Heart, Loader2, PlayCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import SpotlightMagnifier from '@/components/products/SpotlightMagnifier'; // ✅ Inherited component
import { getDesignById, getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { checkWishlistStatus, addToWishlist, removeFromWishlist } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Design | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWished, setIsWished] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>('');
  const [activeMediaType, setActiveMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  // ✅ Security: Restrict Right-Click on the entire main interaction area
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const designData = await getDesignById(Number(id)); 
        setProduct(designData);
        setActiveMediaUrl(getAssetUrl(designData.assetUuid)); 
        setActiveMediaType('IMAGE');

        const related = await getDesigns({ segment: designData.segment, limit: 5 }); 
        setRelatedProducts(related.content.filter((p: Design) => p.id !== designData.id));

        const wished = await checkWishlistStatus(designData.id);
        setIsWished(wished);
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to Bag", description: `${product.title} is ready for download.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Authentication required." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
        setIsWished(false);
      } else {
        await addToWishlist(product.id);
        setIsWished(true);
      }
      toast({ title: isWished ? "Removed" : "Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Authentication required." });
    }
  };

  if (loading || !product) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-slate-200" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white selection:bg-slate-100" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        <div className="bg-white border-b border-slate-100">
          <div className="container px-6 py-4">
            <nav className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <Link to="/" className="hover:text-[#2A2623] transition-colors">Home</Link>
              <ChevronRight size={10} strokeWidth={3} className="text-slate-200" />
              <Link to="/gallery" className="hover:text-[#2A2623] transition-colors">Collections</Link>
              <ChevronRight size={10} strokeWidth={3} className="text-slate-200" />
              <span className="text-[#2A2623] tracking-[0.1em]">{product.title}</span>
            </nav>
          </div>
        </div>

        <section className="py-12 lg:py-20">
          <div className="container px-6">
            <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto items-start">
              
              <div className="flex-1 flex flex-col gap-6 max-w-[580px]">
                {/* ✅ Spotlight & Magnifier Interaction */}
                <div className="relative aspect-square overflow-hidden rounded-sm shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
                   {activeMediaType === 'VIDEO' ? (
                     <video 
                      src={activeMediaUrl} 
                      autoPlay loop muted 
                      className="w-full h-full object-cover" 
                      onContextMenu={handleContextMenu}
                     />
                   ) : (
                     <SpotlightMagnifier 
                        imageUrl={activeMediaUrl} 
                        zoomLevel={1.8} 
                        magnifierRadius={110} 
                     />
                   )}
                </div>

                <div className="flex flex-row gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  <button 
                    onClick={() => { setActiveMediaUrl(getAssetUrl(product.assetUuid)); setActiveMediaType('IMAGE'); }}
                    className={`w-20 h-20 rounded-sm border transition-all duration-300 overflow-hidden flex-shrink-0 ${activeMediaUrl === getAssetUrl(product.assetUuid) ? 'border-[#2A2623] scale-95' : 'border-slate-100 grayscale hover:grayscale-0'}`}
                  >
                    <img src={getAssetUrl(product.assetUuid)} className="w-full h-full object-cover" alt="Primary" draggable={false} />
                  </button>

                  {product.media?.map((m, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { setActiveMediaUrl(m.url); setActiveMediaType(m.type as any); }}
                      className={`relative w-20 h-20 rounded-sm border transition-all duration-300 overflow-hidden flex-shrink-0 ${activeMediaUrl === m.url ? 'border-[#2A2623] scale-95' : 'border-slate-100 grayscale hover:grayscale-0'}`}
                    >
                      {m.type === 'VIDEO' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <PlayCircle className="text-white w-7 h-7 stroke-1" />
                        </div>
                      ) : (
                        <img src={m.url} className="w-full h-full object-cover" alt="Gallery" draggable={false} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col pt-2 lg:max-w-[420px]">
                <div className="mb-6 flex gap-3">
                  {product.premium && (
                    <span className="bg-slate-50 text-[#2A2623] border border-slate-200 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full">
                      Premium Design
                    </span>
                  )}
                  <span className="bg-white text-slate-400 border border-slate-100 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full">
                    {product.segment?.replace('_', ' ')}
                  </span>
                </div>

                <h1 className="font-serif text-4xl lg:text-5xl mb-4 text-[#2A2623] leading-[1.1] tracking-tight">{product.title}</h1>
                
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-3xl font-medium text-[#2A2623] tracking-tight">₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}</span>
                  {product.discountPercent > 0 && (
                    <span className="text-lg text-slate-300 line-through font-light italic">₹{(product.basePriceCents / 100).toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="text-slate-500 mb-10 text-[15px] leading-[1.7] font-light">
                  <p className="mb-8">{product.description}</p>
                  
                  <div className="space-y-5 pt-8 border-t border-slate-100">
                    <h4 className="text-[#2A2623] font-bold text-[10px] uppercase tracking-[0.2em]">Asset Specifications</h4>
                    <div className="grid grid-cols-2 gap-y-6">
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Master Format</span>
                          <span className="text-xs font-semibold text-[#2A2623]">Industrial TIFF / AI</span>
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Resolution</span>
                          <span className="text-xs font-semibold text-[#2A2623]">300+ DPI Optimized</span>
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">License Type</span>
                          <span className="text-xs font-semibold text-[#2A2623]">{product.premium ? 'Exclusive' : 'Standard'} Rights</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    size="lg" 
                    className="w-full h-16 bg-[#2A2623] hover:bg-black text-white text-[11px] font-bold uppercase tracking-[0.25em] rounded-sm transition-all shadow-xl shadow-slate-200 active:scale-95" 
                    onClick={handleAddToCart} 
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="animate-spin mr-2" /> : <ShoppingBag className="mr-2" size={16} strokeWidth={2.5} />}
                    Add to Cart
                  </Button>
                  
                  <button 
                    onClick={handleToggleWishlist}
                    className="w-full h-14 flex items-center justify-center gap-3 border border-slate-200 text-[#2A2623] hover:bg-slate-50 font-bold text-[10px] uppercase tracking-[0.2em] rounded-sm transition-colors"
                  >
                    <Heart className={`${isWished ? 'fill-rose-500 stroke-rose-500' : 'stroke-[#2A2623]'}`} size={16} strokeWidth={2} />
                    {isWished ? 'Saved to Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="bg-white border-t border-slate-100 py-24">
            <div className="container px-6">
              <div className="flex items-end justify-between mb-12 max-w-6xl mx-auto">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">Curation</p>
                  <h2 className="font-serif text-3xl text-[#2A2623] tracking-tight italic">Similar Perspectives</h2>
                </div>
                <Link to={`/gallery?segment=${product.segment}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A2623] hover:text-slate-400 transition-colors border-b-2 border-slate-100 pb-1">
                  View Full Collection
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;