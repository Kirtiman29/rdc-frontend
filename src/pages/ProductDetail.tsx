import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Heart, Loader2, PlayCircle, ShieldCheck, Hash, AlertCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

  // --- PROTECTION STATES ---
  const [isBlurred, setIsBlurred] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- MOBILE DETECTION ---
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isMobile) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLensPosition({ x, y });
  };

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      setLoading(true);
      setIsBlurred(false); 
      try {
        const designData: any = await getDesignById(Number(id)); 
        setProduct(designData);
        setActiveMediaUrl(getAssetUrl(designData.assetUuid)); 
        setActiveMediaType('IMAGE');

        // ✅ AUTO-BLUR TIMER: Triggers after 5 seconds (Only for Desktop)
        const timer = setTimeout(() => {
          if (!isMobile) setIsBlurred(true);
        }, 5000);

        try {
          const res: any = await getDesigns({ 
            segment: designData.segment,
            limit: 10 
          });
          const content = (Array.isArray(res) ? res : res?.content || [])
            .filter((p: Design) => p.id !== designData.id);
          setRelatedProducts([...content].sort((a, b) => b.id - a.id).slice(0, 4));
        } catch (err) {
          console.error('Related sync failed:', err);
        }

        const wished = await checkWishlistStatus(designData.id);
        setIsWished(wished);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [id, isMobile]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to Bag", description: `${product.title} is ready for checkout.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please login." });
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
        <div className="bg-white border-b border-slate-50">
          <div className="container px-6 py-4 mx-auto max-w-[1200px]">
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
          <div className="container px-6 mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 max-w-[1200px] mx-auto items-start">
              
              {/* LEFT: MEDIA SHOWCASE */}
              <div className="w-full lg:w-3/5 flex flex-col gap-6">
                <div 
                  ref={containerRef}
                  className={cn(
                    "relative aspect-square overflow-hidden bg-[#F9F9F9] border border-slate-100 shadow-sm rounded-sm",
                    !isMobile && "cursor-crosshair"
                  )}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => !isMobile && setShowLens(true)}
                  onMouseLeave={() => setShowLens(false)}
                >
                  {/* WATERMARK: Visible on both mobile and desktop */}
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='serif' font-size='36' fill='black' text-anchor='middle' transform='rotate(-30 100 100)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  
                  <div className="absolute inset-0 z-20" onContextMenu={handleContextMenu} />
                  
                  {/* Main Image: Blur ONLY applies to Desktop and remains even when lens is active */}
                  {activeMediaType === 'VIDEO' ? (
                    <video src={activeMediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={activeMediaUrl} 
                      alt={product.title} 
                      className={cn(
                        "w-full h-full object-cover transition-all duration-700",
                        isBlurred && !isMobile ? 'blur-md scale-105' : 'blur-0'
                      )} 
                      draggable={false} 
                    />
                  )}

                  {/* ✅ LENS EFFECT: Desktop Only. Main image stays blurred while lens is clear */}
                  {showLens && !isMobile && activeMediaType === 'IMAGE' && (
                    <div
                      className="absolute z-30 pointer-events-none rounded-full border-2 border-white shadow-2xl overflow-hidden"
                      style={{
                        width: 200,
                        height: 200,
                        top: lensPosition.y - 100,
                        left: lensPosition.x - 100,
                        backgroundImage: `url(${activeMediaUrl})`,
                        backgroundSize: '250%', 
                        backgroundPosition: `${(lensPosition.x / (containerRef.current?.offsetWidth || 1)) * 100}% ${(lensPosition.y / (containerRef.current?.offsetHeight || 1)) * 100}%`,
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {/* Internal Watermark in Lens */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='serif' font-size='12' fill='white' text-anchor='middle' transform='rotate(-30 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`, backgroundRepeat: 'repeat'}} />
                    </div>
                  )}

                  {/* DESKTOP ONLY HINT: Hidden on Mobile */}
                  {isBlurred && !showLens && !isMobile && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 pointer-events-none">
                       <span className="bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-800 rounded-full shadow-lg border border-white">
                         Hover to inspect details
                       </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {product.media && product.media.length > 1 && (
                  <div className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {product.media.map((m, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setActiveMediaUrl(m.url); setActiveMediaType(m.type as any); setIsBlurred(false); }}
                        className={`relative w-24 h-24 border transition-all duration-500 rounded-sm ${activeMediaUrl === m.url ? 'border-zinc-900 shadow-lg' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
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

              {/* RIGHT: INFO PANEL */}
              <div className="w-full lg:w-2/5 flex flex-col pt-4">
                <div className="flex items-center gap-3 mb-8">
                  {product.premium && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-sm">
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

                <div className="flex items-center gap-2 mb-8 bg-zinc-50 border border-zinc-100 w-fit px-4 py-2 rounded-sm">
                  <Hash size={10} className="text-zinc-400" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border-r border-zinc-200 pr-3 mr-1">Design ID</span>
                  <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                    {product.designIdentifier || `RDC-${product.id}`}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-4 mb-10 border-b border-zinc-100 pb-6">
                  <span className="font-serif text-4xl font-light text-[#1A1A1A]">
                    ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-xl text-zinc-300 line-through font-light">
                      ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="text-zinc-500 mb-12 text-[15px] leading-relaxed font-light italic border-l-2 border-zinc-900 pl-6">
                  {product.description}
                </p>

                {/* TECHNICAL SPECS */}
                <div className="mb-12 space-y-6 bg-zinc-50/50 p-8 rounded-sm border border-zinc-100 font-sans">
                  <h4 className="text-[#1A1A1A] font-bold text-[11px] uppercase tracking-[0.2em] border-b border-zinc-200 pb-3">
                    Master File Specs
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-y-8 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Master Format</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">Industrial TIFF</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">DPI Resolution</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">300+ Print Ready</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Seamless</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">Infinite Repeat</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Licensing</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">
                        {product.premium ? 'Full Exclusive' : 'Commercial Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 flex gap-3">
                    <AlertCircle size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        <span className="font-bold text-zinc-900 uppercase tracking-tighter mr-1">Purchase Policy:</span> 
                        Digital design assets are strictly non-refundable once the master file link is generated.
                      </p>
                       <p className="text-[11px] text-zinc-600 leading-relaxed">
                        <span className="font-bold text-zinc-900 uppercase tracking-tighter mr-1">Color Accuracy:</span> 
                        Please note that shades may vary based on display quality and hardware calibration. We recommend reviewing on professional-grade monitors.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    size="lg" 
                    className="w-full h-16 bg-[#2A2623] hover:bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-sm transition-all active:scale-[0.98] shadow-lg" 
                    onClick={handleAddToCart} 
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="animate-spin mr-2" /> : <ShoppingBag className="mr-3" size={14} />}
                    Add to Bag
                  </Button>
                  
                  <button 
                    onClick={handleToggleWishlist}
                    className="w-full h-14 flex items-center justify-center gap-3 border border-zinc-200 text-[#1A1A1A] hover:bg-zinc-50 font-bold text-[10px] uppercase tracking-[0.3em] transition-colors rounded-sm"
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
          <section className="py-24 border-t border-zinc-100 bg-[#FAFAFA]">
            <div className="container px-6 mx-auto max-w-[1200px]">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Segment Alignment</span>
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