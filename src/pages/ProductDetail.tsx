import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Heart, Loader2, PlayCircle, ShieldCheck, Hash } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { getDesignById, getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { checkWishlistStatus, addToWishlist, removeFromWishlist } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
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

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const designData = await getDesignById(Number(id)); 
        setProduct(designData);
        
        setActiveMediaUrl(getAssetUrl(designData.assetUuid)); 
        setActiveMediaType('IMAGE');

        try {
          const primaryRelated = await getDesigns({ 
            segment: designData.segment,
            trending: designData.trending || undefined,
            premium: designData.premium || undefined,
            editorsPick: designData.editorsPick || undefined,
            specialOffer: designData.specialOffer || undefined,
            limit: 10 
          });

          const primaryContent = (Array.isArray(primaryRelated) ? primaryRelated : primaryRelated?.content || [])
            .filter((p: Design) => p.id !== designData.id);

          let finalRelated = [...primaryContent];

          if (finalRelated.length < 4) {
            const fallbackRelated = await getDesigns({ 
              segment: designData.segment, 
              limit: 10 
            });
            const fallbackContent = (Array.isArray(fallbackRelated) ? fallbackRelated : fallbackRelated?.content || [])
              .filter((p: Design) => p.id !== designData.id && !finalRelated.some(existing => existing.id === p.id));
            
            finalRelated = [...finalRelated, ...fallbackContent];
          }

          setRelatedProducts(
            finalRelated
              .sort((a, b) => b.id - a.id)
              .slice(0, 4)
          );
        } catch (relatedError) {
          console.error('Failed to fetch related designs:', relatedError);
        }

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
      toast({ title: "Added to Bag", description: `${product.title} is ready for checkout.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please login to add designs to your cart." });
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
      toast({ title: isWished ? "Removed from Selection" : "Saved to Archive" });
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
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-50">
          <div className="container px-6 py-4">
            <nav className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
              <Link to="/" className="hover:text-[#2A2623] transition-colors">Archive</Link>
              <ChevronRight size={8} strokeWidth={4} className="text-slate-200" />
              <Link to="/gallery" className="hover:text-[#2A2623] transition-colors">Collections</Link>
              <ChevronRight size={8} strokeWidth={4} className="text-slate-200" />
              <span className="text-[#2A2623]">{product.title}</span>
            </nav>
          </div>
        </div>

        <section className="py-12 lg:py-20">
          <div className="container px-6">
            <div className="flex flex-col lg:flex-row gap-16 max-w-[1200px] mx-auto items-start">
              
              {/* LEFT: MEDIA SHOWCASE */}
              <div className="w-full lg:w-3/5 flex flex-col gap-6">
                <div className="relative aspect-square overflow-hidden bg-[#F9F9F9] border border-slate-100">
                   
                   {/* WATERMARK */}
                   <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.08]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='serif' font-size='14' fill='black' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                   />
                   
                   <div className="absolute inset-0 z-20" onContextMenu={handleContextMenu} />

                   {activeMediaType === 'VIDEO' ? (
                     <video src={activeMediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
                   ) : (
                     <img src={activeMediaUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-110" draggable={false} />
                   )}
                </div>

                {/* Thumbnails */}
                {product.media && product.media.length > 1 && (
                  <div className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {product.media.map((m, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setActiveMediaUrl(m.url); setActiveMediaType(m.type as any); }}
                        className={`relative w-24 h-24 border transition-all duration-500 ${activeMediaUrl === m.url ? 'border-zinc-900 shadow-lg' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                      >
                        {m.type === 'VIDEO' ? (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <PlayCircle className="text-white w-6 h-6 stroke-1" />
                          </div>
                        ) : (
                          <img src={m.url} className="w-full h-full object-cover" alt="Thumbnail" draggable={false} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: EDITORIAL INFO */}
              <div className="w-full lg:w-2/5 flex flex-col pt-4">
                <div className="flex items-center gap-3 mb-8">
                  {product.premium && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                      <ShieldCheck size={10} /> Premium Exclusive
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
                    {product.segment?.replace('_', ' ')}
                  </span>
                </div>

                <h1 className="font-serif text-4xl lg:text-6xl mb-6 text-[#1A1A1A] leading-tight tracking-tight">
                  {product.title}
                </h1>

                {/* ✅ DESIGN ID / SKU SECTION */}
                <div className="flex items-center gap-2 mb-8 bg-zinc-50 border border-zinc-100 w-fit px-4 py-2 rounded-sm">
                  <Hash size={10} className="text-zinc-400" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border-r border-zinc-200 pr-3 mr-1">Design ID</span>
                  <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                    {product.designIdentifier || `RDC-${product.id}`}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-4 mb-10">
                  <span className="font-serif text-4xl font-light text-[#1A1A1A]">
                    ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-xl text-zinc-300 line-through font-light">
                      ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="text-zinc-500 mb-12 text-[15px] leading-relaxed font-light italic border-l-2 border-zinc-100 pl-6">
                  {product.description}
                </p>

                {/* Technical Specifications */}
                <div className="mb-12 space-y-6 bg-zinc-50/50 p-8 rounded-sm">
                  <h4 className="text-[#1A1A1A] font-bold text-[10px] uppercase tracking-[0.3em] border-b border-zinc-200 pb-3">Master File Specs</h4>
                  <div className="grid grid-cols-2 gap-y-8">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Master Format</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">Industrial TIFF</span>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">DPI Resolution</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">300+ Print Ready</span>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Seamless</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">Infinite Vertical/Horizontal</span>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Licensing</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">{product.premium ? 'Full Exclusive' : 'Commercial'}</span>
                     </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    size="lg" 
                    className="w-full h-16 bg-zinc-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-none transition-all active:scale-[0.98]" 
                    onClick={handleAddToCart} 
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="animate-spin mr-2" /> : <ShoppingBag className="mr-3" size={14} />}
                    Add to Bag
                  </Button>
                  
                  <button 
                    onClick={handleToggleWishlist}
                    className="w-full h-14 flex items-center justify-center gap-3 border border-zinc-200 text-[#1A1A1A] hover:bg-zinc-50 font-bold text-[10px] uppercase tracking-[0.3em] transition-colors"
                  >
                    <Heart className={`${isWished ? 'fill-rose-500 stroke-rose-500' : 'stroke-zinc-900'}`} size={14} />
                    {isWished ? 'Saved to Archive' : 'Add to Collection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED PATTERNS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="py-24 border-t border-zinc-50">
            <div className="container px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em]">More from this segment</span>
                  <h3 className="font-serif text-3xl mt-2 text-[#1A1A1A]">Related Patterns</h3>
                </div>
                <Link to="/gallery" className="text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900 pb-1 hover:opacity-60 transition-opacity">View All</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {relatedProducts.map(design => (
                  <ProductCard key={design.id} product={design} />
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