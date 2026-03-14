//src/pages/ProductDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
        const designData: any = await getDesignById(Number(id)); 
        setProduct(designData);
        const cover = designData.media?.find(m => m.role === "COVER");

        setActiveMediaUrl(
          cover ? getAssetUrl(cover.url) : getAssetUrl(designData.assetUuid)
        );
        setActiveMediaType('IMAGE');

        try {
          const primarySegment = designData.segments?.[0] || designData.segment;
          const res: any = await getDesigns({
            segment: primarySegment,
            size: 10
          });
          const content = (Array.isArray(res) ? res : res?.content || [])
            .filter((p: Design) => p.id !== designData.id);
          setRelatedProducts([...content].sort((a, b) => b.id - a.id).slice(0, 4));
        } catch (err) {
          console.error('Related sync failed:', err);
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
      toast({
        title: "Added to Bag",
        description: `${product.title} is ready for checkout.`,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || "";
      if (message.toLowerCase().includes("already")) {
        toast({
          title: "Already in Cart",
          description: "This design is already in your cart.",
          variant: "destructive",
        });
        return;
      }
      if (error?.response?.status === 401) {
        navigate('/login', { state: { redirectTo: `/design/${product.id}` } });
        return;
      }
      toast({
        title: "Error",
        description: "Unable to add item to cart.",
        variant: "destructive",
      });
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
      navigate('/login', { state: { redirectTo: `/design/${product.id}` } });
    }
  };

  if (loading || !product) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white font-sans">
        <div className="animate-pulse bg-slate-100 w-[500px] h-[600px]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans selection:bg-slate-100" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1 w-full">
        {/* Navigation Breadcrumbs */}
        <div className="bg-white border-b border-slate-50">
          <div className="w-full max-w-[1200px] mx-auto px-6 py-4">
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
          <div className="w-full max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 w-full items-start">
              
              {/* LEFT: MEDIA SHOWCASE & DESCRIPTION */}
              <div className="w-full lg:w-3/5 flex flex-col gap-6">
                
                <div className="relative w-full max-h-[800px] overflow-hidden bg-[#F9F9F9] border border-slate-100 shadow-sm rounded-sm flex items-center justify-center">
                  
                  {/* Watermark Overlay (Sans Font) */}
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='36' fill='black' text-anchor='middle' transform='rotate(-30 100 100)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  
                  {/* Protection Layer */}
                  <div className="absolute inset-0 z-20" onContextMenu={handleContextMenu} />
                  
                  {activeMediaType === 'VIDEO' ? (
                    <video
                      src={activeMediaUrl}
                      controls
                      loop
                      autoPlay
                      muted
                      playsInline
                      className="w-full max-h-[800px] object-contain"
                    />
                  ) : (
                    <img 
                      src={activeMediaUrl} 
                      alt={product.title} 
                      className="w-full max-h-[800px] object-contain"
                    />
                  )}
                </div>

                {/* Thumbnails */}
                {product.media && product.media.length > 1 && (
                  <div className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {product.media.map((m, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { 
                          setActiveMediaUrl(getAssetUrl(m.url)); 
                          setActiveMediaType(m.type as any); 
                        }}
                        className={`relative w-24 h-24 border transition-all duration-500 rounded-sm ${activeMediaUrl === getAssetUrl(m.url) ? 'border-zinc-900 shadow-lg' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                      >
                        {m.type === 'VIDEO' ? (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <PlayCircle className="text-white w-6 h-6 stroke-1" />
                          </div>
                        ) : (
                          <img src={getAssetUrl(m.url)} className="w-full h-full object-cover" alt="Thumbnail" draggable={false} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* PRODUCT DESCRIPTION */}
                {product.description && (
                  <div className="mt-10 border-t border-zinc-200 pt-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-black mb-6">
                      Product Description
                    </h3>
                    <div className="grid md:grid-cols-2 gap-12 text-[14px] text-zinc-600 leading-relaxed">
                      <div className="space-y-4 font-light">
                        <ul className="space-y-2">
                            {typeof product.description === "string" &&
                                product.description
                                .split("\n")
                                .filter(line => line.trim() !== "")
                                .map((line, i) => (
                                <li key={i} className="flex items-start gap-2 text-[14px]">
                                  <span className="mt-[6px] w-1.5 h-1.5 bg-zinc-500 rounded-full shrink-0"></span>
                                  <span>{line}</span>
                                </li>
                            ))}
                          </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: INFO PANEL (Sticky behavior added) */}
              <div className="w-full lg:w-2/5 flex flex-col pt-4 lg:sticky lg:top-24">
                <div className="flex items-center gap-3 mb-8">
                  {product.luxury && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-sm">
                      <ShieldCheck size={10} /> Luxury Exclusive
                    </span>
                  )}
                </div>

                <h1 className="font-sans text-4xl lg:text-6xl font-semibold mb-6 text-[#1A1A1A] leading-tight tracking-tight">
                  {product.title}
                </h1>

                {/* SEGMENTS */}
                {product.segments && product.segments.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {product.segments.map((seg, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-[10px] font-semibold bg-zinc-100 text-zinc-700 rounded-full uppercase tracking-wide"
                      >
                        {seg.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}

                {/* DESIGN ID */}
                <div className="flex items-center gap-2 mb-8 bg-zinc-50 border border-zinc-100 w-fit px-4 py-2 rounded-sm">
                  <Hash size={10} className="text-zinc-400" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border-r border-zinc-200 pr-3 mr-1">Design ID</span>
                  <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                    {product.designIdentifier || `RDC-${product.id}`}
                  </span>
                </div>

                {/* PRICE SECTION (Sans Font) */}
                <div className="flex items-center gap-4 mb-10 border-b border-zinc-100 pb-6">
                  <div className="flex flex-col">
                    <span className="font-sans text-4xl font-light text-[#1A1A1A]">
                        ₹{Math.round(
  (product.specialOffer
    ? product.basePriceCents * (1 - product.discountPercent / 100)
    : product.basePriceCents
  ) / 100
).toLocaleString('en-IN')}
                    </span>
                    {product.discountPercent > 0 && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1">
                        {product.discountPercent}% OFF
                        </span>
                    )}
                  </div>
                  {product.discountPercent > 0 && (
                    <span className="text-xl text-zinc-300 line-through font-light self-start mt-2 font-sans">
                      ₹{Math.round(product.basePriceCents / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* CATEGORIES */}
                {product.categories && product.categories.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-3">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-3 py-1 text-[10px] font-semibold bg-zinc-100 text-zinc-700 rounded-full"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAGS */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mb-12">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-3">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-[10px] bg-zinc-100 text-zinc-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* TECHNICAL SPECS */}
                <div className="mb-12 space-y-6 bg-zinc-50/50 p-8 rounded-sm border border-zinc-100" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  <h4 className="text-[#1A1A1A] font-bold text-[11px] uppercase tracking-[0.2em] border-b border-zinc-200 pb-3">
                    Master File Specs
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Master Format</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">
                        {product.imageFormat || 'Industrial TIFF'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">DPI Resolution</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">
                        {product.resolution ? `${product.resolution} DPI` : '300+ Print Ready'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Seamless</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">
                        {product.repeatSize ? product.repeatSize?.replace("x"," × ") : "Seamless Repeat"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Color Count</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">
                            {product.colorCount || 'N/A'}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Image Type</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">
                            {product.imageType || 'Raster'}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Design Type</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">
                            {product.designType || 'Digital'}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">File Type</span>
                        <span className="text-xs font-medium text-[#1A1A1A]">
                        {product.media?.find(m => m.role === "DOWNLOAD")?.type || "TIFF"}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Licensing</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">
                        {product.luxury ? 'Full Exclusive' : 'Commercial Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 flex gap-3">
                    <AlertCircle size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        <span className="font-bold text-zinc-900 uppercase tracking-tighter mr-1">Refund Policy:</span> 
                        Digital assets are non-refundable once the high-resolution master file download link has been generated or delivered.
                      </p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        <span className="font-bold text-zinc-900 uppercase tracking-tighter mr-1">Color Accuracy:</span> 
                        Color appearance may vary depending on screen settings and hardware calibration. For the most accurate color evaluation, we recommend viewing the design on a professionally calibrated monitor.
                      </p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        <span className="font-bold text-zinc-900 uppercase tracking-tighter mr-1">Exclusivity:</span> 
                        Upon successful acquisition, this design will be permanently removed from our public catalog and will not be resold or redistributed.
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
                    Add to Cart
                  </Button>
                  
                  <button 
                    onClick={handleToggleWishlist}
                    className="w-full h-14 flex items-center justify-center gap-3 border border-zinc-200 text-[#1A1A1A] hover:bg-zinc-50 font-bold text-[10px] uppercase tracking-[0.3em] transition-colors rounded-sm"
                  >
                    <Heart className={`${isWished ? 'fill-rose-500 stroke-rose-500' : 'stroke-zinc-900'}`} size={14} />
                    {isWished ? 'Saved to Archive' : 'Add to Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED PATTERNS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="py-24 border-t border-zinc-100 bg-[#FAFAFA]">
            <div className="w-full max-w-[1200px] mx-auto px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Segment Alignment</span>
                  <h3 className="font-sans font-semibold text-3xl mt-2 text-[#1A1A1A]">Related Patterns</h3>
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